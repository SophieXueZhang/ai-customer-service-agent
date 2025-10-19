import { fileSearchTool, webSearchTool, codeInterpreterTool, Agent, Runner } from "@openai/agents";
import { z } from "zod";

// Tool definitions
const fileSearch = fileSearchTool(["vs_68f2c49f66708191b54ca4594d77c42a"]);

const webSearchPreview = webSearchTool({
  searchContextSize: "medium",
  userLocation: { type: "approximate" }
});

const codeInterpreter = codeInterpreterTool({
  container: {
    type: "auto",
    file_ids: []
  }
});

const ClassifySchema = z.object({
  operating_procedure: z.enum(["q-and-a", "fact-finding", "other"])
});

// Agents
const queryRewrite = new Agent({
  name: "Query rewrite",
  instructions: "Rewrite the user's question to be more specific and relevant to the knowledge base.",
  model: "gpt-4o",
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true
  }
});

const classify = new Agent({
  name: "Classify",
  instructions: "Determine whether the question should use the Q&A or fact-finding process.",
  model: "gpt-4o",
  outputType: ClassifySchema,
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true
  }
});

const internalQA = new Agent({
  name: "Internal Q&A",
  instructions: "Answer the user's question using the knowledge tools you have on hand (file or web search). Be concise and answer succinctly, using bullet points and summarizing the answer up front",
  model: "gpt-4o",
  tools: [fileSearch],
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true
  }
});

const externalFactFinding = new Agent({
  name: "External fact finding",
  instructions: `Explore external information using the tools you have (web search, file search, code interpreter).
Analyze any relevant data, checking your work.

Make sure to output a concise answer followed by summarized bullet point of supporting evidence`,
  model: "gpt-4o",
  tools: [webSearchPreview, codeInterpreter],
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true
  }
});

const agent = new Agent({
  name: "Agent",
  instructions: "Ask the user to provide more detail so you can help them by either answering their question or running data analysis relevant to their query",
  model: "gpt-4o-mini",
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true
  }
});

// Main workflow
async function runWorkflow(inputText) {
  const conversationHistory = [
    {
      role: "user",
      content: [{ type: "input_text", text: inputText }]
    }
  ];

  const runner = new Runner({
    traceMetadata: {
      __trace_source__: "agent-builder",
      workflow_id: "wf_68f2c415a5548190ac4fec12246cf4c70b8497b17cbad244"
    }
  });

  // Step 1: Query Rewrite
  const queryRewriteResult = await runner.run(queryRewrite, [
    ...conversationHistory,
    {
      role: "user",
      content: [{ type: "input_text", text: `Original question: ${inputText}` }]
    }
  ]);
  conversationHistory.push(...queryRewriteResult.newItems.map(item => item.rawItem));

  if (!queryRewriteResult.finalOutput) {
    throw new Error("Query rewrite failed");
  }

  const rewrittenQuery = queryRewriteResult.finalOutput;

  // Step 2: Classify
  const classifyResult = await runner.run(classify, [
    ...conversationHistory,
    {
      role: "user",
      content: [{ type: "input_text", text: `Question: ${rewrittenQuery}` }]
    }
  ]);
  conversationHistory.push(...classifyResult.newItems.map(item => item.rawItem));

  if (!classifyResult.finalOutput) {
    throw new Error("Classification failed");
  }

  const procedure = classifyResult.finalOutput.operating_procedure;

  // Step 3: Route to appropriate agent
  let finalResult;

  if (procedure === "q-and-a") {
    const qaResult = await runner.run(internalQA, conversationHistory);
    conversationHistory.push(...qaResult.newItems.map(item => item.rawItem));
    finalResult = qaResult.finalOutput;
  } else if (procedure === "fact-finding") {
    const factResult = await runner.run(externalFactFinding, conversationHistory);
    conversationHistory.push(...factResult.newItems.map(item => item.rawItem));
    finalResult = factResult.finalOutput;
  } else {
    const fallbackResult = await runner.run(agent, conversationHistory);
    conversationHistory.push(...fallbackResult.newItems.map(item => item.rawItem));
    finalResult = fallbackResult.finalOutput;
  }

  return finalResult || "No response generated";
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
    }

    const response = await runWorkflow(message);

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Agent error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

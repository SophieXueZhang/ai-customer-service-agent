# AI Customer Service Agent

基于 OpenAI Agents SDK 构建的客服 Agent，部署在 Vercel 上。

## 项目结构

```
.
├── api/
│   └── chat.js          # Vercel Serverless Function (后端 API)
├── public/
│   └── index.html       # 聊天界面 (前端)
├── .env                 # 本地环境变量 (不要提交到 Git!)
├── vercel.json          # Vercel 配置文件
└── package.json         # 项目依赖
```

## 部署步骤

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署到 Vercel

```bash
cd "/Users/pc/Documents/Udemy/agents in websites"
vercel
```

首次部署会问你几个问题：
- Set up and deploy? → **Yes**
- Which scope? → 选择你的账户
- Link to existing project? → **No**
- What's your project's name? → **agents-in-websites** (或自定义)
- In which directory is your code located? → **./** (直接回车)

### 4. 配置环境变量

部署后，需要在 Vercel 后台添加 API Key：

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加变量：
   - **Name**: `OPENAI_API_KEY`
   - **Value**: 你的 `.env` 文件里的 API Key
   - **Environments**: 勾选 **Production**, **Preview**, **Development**
5. 点击 **Save**

### 5. 重新部署

```bash
vercel --prod
```

部署成功后会给你一个 URL，比如：
```
https://agents-in-websites.vercel.app
```

打开这个 URL 就能看到聊天界面了！

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动本地开发服务器

```bash
npx vercel dev
```

访问: http://localhost:3000

---

## 注意事项

⚠️ **安全提醒**：
- `.env` 文件已加入 `.gitignore`，**永远不要**提交到 Git
- API Key 只能存在 Vercel 的环境变量里
- 不要把 API Key 硬编码在代码里

⚠️ **成本控制**：
- OpenAI API 按使用量计费
- 建议在 [OpenAI Dashboard](https://platform.openai.com/usage) 设置使用限额
- 可以添加速率限制防止滥用

---

## 常见问题

### Q: 部署后无法访问？
A: 检查 Vercel 环境变量是否正确配置。

### Q: 报错 "Agent result is undefined"？
A: 检查 OpenAI API Key 是否有效，账户是否有余额。

### Q: 如何更新代码？
A: 修改代码后运行 `vercel --prod` 重新部署。

### Q: 如何查看日志？
A: Vercel Dashboard → 你的项目 → Functions → 点击函数查看日志。

---

## 技术栈

- **前端**: 原生 HTML/CSS/JavaScript
- **后端**: Vercel Serverless Functions (Node.js)
- **AI**: OpenAI Agents SDK
- **部署**: Vercel

## License

MIT

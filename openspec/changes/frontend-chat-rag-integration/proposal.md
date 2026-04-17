## Why

前端 AI 对话功能（ChatWindow）目前只能使用 AI 模型的训练知识回答用户问题，无法访问 WorldMonitor 本地新闻数据库。当用户询问"最新的AI新闻"或"今天的地缘政治热点"时，AI 无法提供基于实际新闻数据的准确回答，降低了产品的实用价值和用户体验。

## What Changes

- 修改 `/api/ai/chat` 端点，增加新闻检索逻辑作为上下文注入
- 实现 RAG（检索增强生成）流程：用户问题 → 检索相关新闻 → 注入上下文 → AI 生成回答
- 复用现有的 MCP 工具 `analyzeTrends` 的新闻检索逻辑
- 前端 ChatWindow 无需修改，继续使用现有 API

## Capabilities

### New Capabilities

- `chat-news-rag`: 让 AI 对话能够基于本地新闻数据回答用户问题
  - 接收用户消息，自动识别关键词
  - 检索相关新闻标题和摘要
  - 构建包含新闻上下文的 system prompt
  - 调用 AI API 生成回答

### Modified Capabilities

- `ai-chat`: 现有 AI 对话功能需要扩展以支持新闻上下文注入
  - 当前：仅转发用户消息到 AI API
  - 变更后：检索相关新闻并注入上下文后调用 AI API

## Impact

### Affected Code

- `server/routes/ai-chat.ts` - 修改 POST /chat 端点
- `server/repositories/news.ts` - 可能需要添加关键词搜索函数
- `server/services/ai-providers.ts` - 复用 simpleChat

### Dependencies

- PostgreSQL 数据库连接（已有）
- 新闻数据表 rss_items（已存在）

### No Breaking Changes

- 前端 ChatWindow API 调用格式不变
- 现有 API 端点 `/api/ai/chat` 保持兼容

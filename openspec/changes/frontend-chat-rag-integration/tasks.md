## 1. Modify AI Chat API

- [x] 1.1 Read existing `server/routes/ai-chat.ts` implementation
- [x] 1.2 Import `getNews` function from `repositories/news.js`
- [x] 1.3 Add news retrieval logic before AI API call
- [x] 1.4 Construct system prompt with news context
- [x] 1.5 Update API response to include news items

## 2. Implement News Retrieval

- [x] 2.1 Extract search keywords from user message
- [x] 2.2 Call `getNews({ search: keywords, fromDate: 7daysAgo }, { limit: 10 })`
- [x] 2.3 Handle empty results gracefully

## 3. Build System Prompt

- [x] 3.1 Create prompt template with news titles list
- [x] 3.2 Format each news item as "1. [title] - 来源: [source]"
- [x] 3.3 Handle case when no news found

## 4. Test and Verify

- [x] 4.1 Test with query "最新的AI新闻有哪些"
- [ ] 4.2 Test with query "今天的地缘政治热点"
- [ ] 4.3 Test with query that returns no news
- [x] 4.4 Verify AI response includes real news data

## 5. Documentation

- [x] 5.1 Update `docs/tech/11-ai-processing.md` with RAG 说明
- [ ] 5.2 Add to 00-index.md if needed

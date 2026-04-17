# MCP Server - Model Context Protocol

## Overview

The WorldMonitor MCP Server enables natural language querying of news data through the Model Context Protocol. This allows AI assistants like Claude Desktop to query WorldMonitor's news database using natural language commands.

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install @modelcontextprotocol/sdk
```

### 2. Configure Claude Desktop

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "worldmonitor": {
      "command": "tsx",
      "args": ["server/mcp/index.ts"],
      "cwd": "/path/to/worldmonitor"
    }
  }
}
```

### 3. Restart Claude Desktop

After configuration changes, restart Claude Desktop to load the new MCP server.

### 4. Test Connection

In Claude Desktop, try:
- "What's the latest news?"
- "Search for news about AI"
- "Show me news clusters"
- "Analyze trends for Taiwan"
- "What's the current threat overview?"

---

## Phase 1 Tools (News Query)

### get_latest_news

Get the latest news items with optional filters.

**Arguments:**
```typescript
{
  category?: string;  // Filter by category (e.g., "geopolitics")
  source?: string;    // Filter by source URL
  limit?: number;     // Items to return (default: 50, max: 100)
  page?: number;       // Page number (default: 1)
}
```

**Example:**
```
Get the latest 10 technology news items
```

---

### search_news

Search news by query string.

**Arguments:**
```typescript
{
  query: string;      // Required: Search query
  category?: string;  // Filter by category
  source?: string;    // Filter by source URL
  limit?: number;      // Items to return (default: 50)
  page?: number;       // Page number (default: 1)
}
```

**Example:**
```
Search for news about Taiwan tensions
```

---

### get_news_clusters

Get news clusters - groups of related news items.

**Arguments:**
```typescript
{
  minItems?: number;  // Min items in cluster (default: 2)
}
```

**Example:**
```
Show me news clusters with at least 3 items
```

---

### get_recent_reports

Get recent AI-generated reports.

**Arguments:**
```typescript
{
  limit?: number;     // Reports to return (default: 20)
  offset?: number;    // Pagination offset (default: 0)
  category?: string;  // Filter: tech, world, daily, weekly
}
```

**Example:**
```
Get the last 5 weekly reports
```

---

### get_news_sources

Get available news sources. No arguments.

**Example:**
```
What news sources are available?
```

---

### get_news_categories

Get available news categories. No arguments.

**Example:**
```
List all news categories
```

---

### get_news_by_id

Get a specific news item by ID.

**Arguments:**
```typescript
{
  id: number;  // Required: News item ID
}
```

**Example:**
```
Get news item with ID 12345
```

---

## Phase 2 Tools (AI-Powered Analysis)

### analyze_trends

AI-powered analysis of trends for a specific topic. Uses Groq/LLM to analyze recent news and identify patterns.

**Arguments:**
```typescript
{
  topic: string;      // Required: Topic to analyze
  period?: string;     // Time period (e.g., "24h", "7d", "30d") default: "7d"
}
```

**Example:**
```
Analyze trends for AI technology over the past week
```

**Returns:**
- Key themes and patterns identified by AI
- Overall sentiment analysis
- Potential implications
- Emerging or fading trends

---

### get_sentiment_breakdown

Get sentiment distribution statistics across news.

**Arguments:**
```typescript
{
  category?: string;   // Filter by category
  period?: string;     // Time period (e.g., "24h", "7d") default: "24h"
}
```

**Example:**
```
What's the sentiment breakdown for geopolitics news in the last 24 hours?
```

**Returns:**
- Count and percentage for positive/negative/neutral
- Average sentiment score (-1 to +1)

---

### compare_periods

Compare news between two different time periods.

**Arguments:**
```typescript
{
  period1: string;     // First/later period (e.g., "7d")
  period2: string;     // Second/earlier period (e.g., "7d")
  category?: string;   // Filter by category
}
```

**Example:**
```
Compare this week's news to last week's
```

**Returns:**
- Volume changes between periods
- Source distribution comparison
- Category distribution changes
- AI-generated comparison analysis

---

### get_threat_overview

Get overview of threat levels across all news.

**Arguments:** None

**Example:**
```
What's the current threat overview?
```

**Returns:**
- Threat level distribution (critical/high/medium/low/info)
- Top threat categories
- Overall threat score (0-100)
- Top threat news items

---

### generate_report

Generate a new AI report.

**Arguments:**
```typescript
{
  category: string;    // Required: tech, world, daily, weekly
  period?: string;     // Report period
}
```

**Example:**
```
Generate a weekly trend report
```

---

### get_report_content

Get full content of a report by ID.

**Arguments:**
```typescript
{
  id: number;          // Required: Report ID
}
```

**Example:**
```
Get the full content of report ID 42
```

---

### list_reports

List reports with pagination and optional filters.

**Arguments:**
```typescript
{
  limit?: number;      // Reports to return (default: 20, max: 100)
  offset?: number;     // Pagination offset (default: 0)
  category?: string;   // Filter: tech, world, daily, weekly
}
```

**Example:**
```
List all weekly reports
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Desktop                        │
│                  (MCP Client)                           │
└─────────────────────┬───────────────────────────────────┘
                      │ stdio
┌─────────────────────▼───────────────────────────────────┐
│                 WorldMonitor MCP Server                  │
│                  (server/mcp/index.ts)                  │
├─────────────────────────────────────────────────────────┤
│  Tool Handlers          │  Repositories & Services     │
│  ─────────────          │  ─────────────────────      │
│  get_latest_news   ──►  │  getNews()                   │
│  search_news       ──►  │  getNews()                   │
│  get_news_clusters ──►  │  getClusters()              │
│  analyze_trends    ──►  │  simpleChat() + getNews()   │
│  get_threat_overview──► │  getNews() + aggregation    │
│  generate_report   ──►  │  triggerTask()              │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    PostgreSQL Database                   │
│                     (rss_items table)                    │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
server/
├── mcp/
│   ├── index.ts              # MCP Server entry point
│   ├── types.ts              # TypeScript type definitions
│   └── tools/
│       ├── news-tools.ts     # Phase 1 news tools
│       ├── analysis-tools.ts # Phase 2 AI analysis tools
│       └── report-tools.ts   # Phase 2 report tools
```

---

## API Dependencies

The MCP server internally uses:

| Component | Used By | Purpose |
|----------|---------|---------|
| `repositories/news.ts` | get_latest_news, search_news | News data access |
| `services/news-clustering.ts` | get_news_clusters | News clustering |
| `services/ai-providers.ts` | analyze_trends, compare_periods | AI analysis via Groq |
| `services/threat-classifier.ts` | get_threat_overview | Threat aggregation |
| `agent/scheduler.ts` | generate_report | Report triggering |

---

## Troubleshooting

### Server not starting

Check database connection:
```bash
cd server
tsx -e "import { checkConnection } from './database/connection.js'; checkConnection().then(c => console.log(c))"
```

### Tools not responding

Verify MCP server is running:
```bash
tsx server/mcp/index.ts
```

### Claude Desktop not showing tools

1. Check `~/.claude/settings.json` syntax
2. Restart Claude Desktop
3. Check Claude logs for MCP errors

### AI tools failing

- Check `GROQ_API_KEY` environment variable is set
- Verify AI provider health in server logs

---

## Completed Phases

### Phase 1 ✅ - MCP Infrastructure
- MCP Server with stdio transport
- News query tools (get_latest_news, search_news, get_news_clusters, etc.)
- Claude Desktop integration

### Phase 2 ✅ - AI-Powered Analysis
- analyze_trends: AI analysis of specific topics
- compare_periods: AI comparison of news between time periods
- get_sentiment_breakdown: Sentiment statistics
- get_threat_overview: Threat level overview
- Report generation and retrieval tools

### Phase 3 ✅ - AI Sentiment Analysis
- **Server**: `server/services/sentiment-ai.ts`
- **Integration**: `server/agent/rss-collector.ts`
- **Features**:
  - AI-powered sentiment analysis with Groq/LLM
  - Redis caching (24h TTL)
  - Keyword fallback for obvious cases
  - Enable via `USE_AI_SENTIMENT=true`

---

## Future Enhancements (Phase 4)

- **Real-time subscriptions**: Push notifications for breaking news
- **Multi-source aggregation**: Combine external APIs with internal data
- **Auth**: API key authentication for remote access

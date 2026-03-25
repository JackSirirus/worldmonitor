# WorldMonitor Development Notes

## 📋 Documentation-First Workflow (IMPORTANT)

**Before reading source code, ALWAYS check technical documentation first.**

### Priority Order

1. **First** - Read `docs/tech/00-index.md` to find the relevant doc
2. **Second** - Read the specific doc found in index
3. **Third** - Search this file (CLAUDE.md) for additional notes
4. **Fourth** - Only if documentation is insufficient, then read source code

### How to Use the Index

The index file (`00-index.md`) provides **quick topic lookup**:

- **Alphabetical index (A-Z)**: Find by topic name (e.g., "CII", "Redis", "WebSocket")
- **Functional index**: Find by category (deployment, algorithms, AI, etc.)
- **Quick lookup**: Direct links to specific sections

### Example Workflow

```
User: "How does the CII score work?"

Claude:
1. Read docs/tech/00-index.md
2. Find "CII 评分" → points to 10-algorithms.md#1-地缘政治风险评分-cii
3. Read that section in 10-algorithms.md
4. Answer the question
```

### ⚠️ Important

- **DO NOT** read all docs or iterate through them one by one
- **ALWAYS** start with `00-index.md` to locate the right doc
- **ONLY** read source code when:
  - Documentation doesn't exist or is outdated
  - Need to verify specific implementation details
  - Bug requires tracing actual code behavior

---

## 🔄 Documentation Maintenance (IMPORTANT)

**After fixing technical issues or making new technical changes, ALWAYS update the technical documentation.**

### When to Update Docs

| Action | Required Doc Update |
|--------|-------------------|
| Add new API endpoint | Update `docs/tech/08-api.md` |
| Add new component/panel | Update `docs/tech/03-structure.md` |
| Change algorithm logic | Update `docs/tech/10-algorithms.md` |
| Change AI processing | Update `docs/tech/11-ai-processing.md` |
| Change data flow | Update `docs/tech/12-data-flow.md` |
| Add/modify config | Update `docs/tech/05-configuration.md` |
| Add new deployment method | Update `docs/tech/06-deployment.md` |
| Fix bug with new approach | Update relevant doc + add to `09-faq.md` if common |

### Documentation Update Checklist

After completing a code change:

- [ ] Identify which docs need updating
- [ ] Update the relevant technical doc(s)
- [ ] Update index (`00-index.md`) if new topics added
- [ ] Update version and date in index

### What to Document

- **New features**: How they work, API usage, configuration
- **Bug fixes**: Root cause and solution (for FAQ)
- **Changes**: What changed and why
- **New dependencies**: Version, purpose, setup

---

## 🤖 Model Preferences (Jan 30, 2026)

**For ALL coding tasks in WorldMonitor, ALWAYS use:**

| Task | Model | Alias |
|------|-------|-------|
| **Coding** | `openrouter/anthropic/claude-sonnet-4-5` | `sonnet` |
| **Coding** | `openai/gpt-5-2` | `codex` |

**Never default to MiniMax for coding tasks.**

**How to run with preferred model:**
```bash
# Sonnet for coding
clawdbot --model openrouter/anthropic/claude-sonnet-4-5 "build me..."

# Codex for coding  
clawdbot --model openai/gpt-5-2 "build me..."
```

**Set as default:**
```bash
export CLAUDE_MODEL=openrouter/anthropic/claude-sonnet-4-5
```

## CRITICAL: Git Branch Rules

**NEVER merge or push to a different branch without explicit user permission.**

- If on `beta`, only push to `beta` - never merge to `main` without asking
- If on `main`, stay on `main` - never switch branches and push without asking
- NEVER merge branches without explicit request
- Pushing to the CURRENT branch after commits is OK when continuing work

## 🔄 Auto-Push to GitHub

**每次代码修改后会自动推送到 `JackSirirus/worldmonitor` 仓库。**

### 当前配置

| 项目 | 值 |
|------|-----|
| 远程仓库 | `jack` → `https://github.com/JackSirirus/worldmonitor.git` |
| 自动推送分支 | `main` |
| Hook 位置 | `.git/hooks/post-commit` |

### 工作原理

1. 每次在 `main` 分支执行 `git commit` 后
2. `post-commit` hook 自动执行 `git push -u jack main`
3. 代码自动同步到 `JackSirirus/worldmonitor`

### 注意事项

- Hook 文件在 `.git/hooks/` 目录，不随仓库同步
- 如需在其他机器上启用，复制 `post-commit` 到对应机器的 `.git/hooks/`
- 推送使用 `gh` CLI 进行 HTTPS 认证（通过 Windows Credential Manager）

## Critical: RSS Proxy Allowlist

When adding new RSS feeds in `src/config/feeds.ts`, you **MUST** also add the feed domains to the allowlist in `api/rss-proxy.js`.

### Why
The RSS proxy has a security allowlist (`ALLOWED_DOMAINS`) that blocks requests to domains not explicitly listed. Feeds from unlisted domains will return HTTP 403 "Domain not allowed" errors.

### How to Add New Feeds

1. Add the feed to `src/config/feeds.ts`
2. Extract the domain from the feed URL (e.g., `https://www.ycombinator.com/blog/rss/` → `www.ycombinator.com`)
3. Add the domain to `ALLOWED_DOMAINS` array in `api/rss-proxy.js`
4. Deploy changes to Vercel

### Example
```javascript
// In api/rss-proxy.js
const ALLOWED_DOMAINS = [
  // ... existing domains
  'www.ycombinator.com',  // Add new domain here
];
```

### Debugging Feed Issues
If a panel shows "No news available":
1. Open browser DevTools → Console
2. Look for `HTTP 403` or "Domain not allowed" errors
3. Check if the domain is in `api/rss-proxy.js` allowlist

## Site Variants

Two variants controlled by `VITE_VARIANT` environment variable:

- `world` (default): Geopolitical focus - worldmonitor.app
- `tech`: Tech/startup focus - tech.worldmonitor.app

### Running Locally
```bash
npm run dev        # Full variant
npm run dev:tech   # Tech variant
```

### Building
```bash
npm run build      # Production build for worldmonitor.app (default world variant)
npm run build:tech # Production build for tech.worldmonitor.app
```

## Custom Feed Scrapers

Some sources don't provide RSS feeds. Custom scrapers are in `/api/`:

| Endpoint | Source | Notes |
|----------|--------|-------|
| `/api/fwdstart` | FwdStart Newsletter (Beehiiv) | Scrapes archive page, 30min cache |

### Adding New Scrapers
1. Create `/api/source-name.js` edge function
2. Scrape source, return RSS XML format
3. Add to feeds.ts: `{ name: 'Source', url: '/api/source-name' }`
4. No need to add to rss-proxy allowlist (direct API, not proxied)

## AI Summarization & Caching

The AI Insights panel uses a server-side Redis cache to deduplicate API calls across users.

### Required Environment Variables

```bash
# Groq API (primary summarization)
GROQ_API_KEY=gsk_xxx

# OpenRouter API (fallback)
OPENROUTER_API_KEY=sk-or-xxx

# Upstash Redis (cross-user caching)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### How It Works

1. User visits → `/api/groq-summarize` receives headlines
2. Server hashes headlines → checks Redis cache
3. **Cache hit** → return immediately (no API call)
4. **Cache miss** → call Groq API → store in Redis (24h TTL) → return

### Model Selection

- **llama-3.1-8b-instant**: 14,400 req/day (used for summaries)
- **llama-3.3-70b-versatile**: 1,000 req/day (quality but limited)

### Fallback Chain

1. Groq (fast, 14.4K/day) → Redis cache
2. OpenRouter (50/day) → Redis cache
3. Browser T5 (unlimited, slower, no cache)

### Setup Upstash

1. Create free account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy REST URL and Token to Vercel env vars

## Service Status Panel

Status page URLs in `api/service-status.js` must match the actual status page endpoint. Common formats:
- Statuspage.io: `https://status.example.com/api/v2/status.json`
- Atlassian: `https://example.status.atlassian.com/api/v2/status.json`
- incident.io: Same endpoint but returns HTML, handled by `incidentio` parser

Current known URLs:
- Anthropic: `https://status.claude.com/api/v2/status.json`
- Zoom: `https://www.zoomstatus.com/api/v2/status.json`
- Notion: `https://www.notion-status.com/api/v2/status.json`

## Allowed Bash Commands

The following additional bash commands are permitted without user approval:
- `Bash(ps aux:*)` - List running processes
- `Bash(grep:*)` - Search text patterns
- `Bash(ls:*)` - List directory contents

## CRITICAL: Bilingual Support (i18n)

**ALL new or modified features MUST consider bilingual (Chinese/English) support.**

### i18n Requirements

When adding or modifying UI elements, follow these rules:

1. **All user-facing text must use the translation system**
   - ❌ `this.content.innerHTML = '<div>Loading...</div>'`
   - ✅ `this.content.innerHTML = `<div>${t('common.loading')}</div>``

2. **Add both English and Chinese translations**
   - Add to `src/i18n/locales/en.ts` (English)
   - Add to `src/i18n/locales/zh-cn.ts` (Simplified Chinese)
   - Add to `src/i18n/locales/zh-tw.ts` (Traditional Chinese)

3. **Content vs UI distinction**
   - **UI elements**: Translate (buttons, labels, tooltips, panel names)
   - **News/Content**: Keep original language (news headlines, article content)

### Translation Key Convention

Use nested namespacing for organization:

```typescript
// Example structure
{
  common: {
    loading: 'Loading',
    failed: 'Failed to load data',
  },
  panels: {
    liveNews: 'Live News',
    markets: 'Markets',
  },
  buttons: {
    close: 'Close',
    save: 'Save',
  },
  tooltips: {
    resize: 'Drag to resize (double-click to reset)',
    summarize: 'Summarize this panel',
  },
}
```

### Language Support

| Language | Code | Locale File | Target Audience |
|----------|-------|-------------|----------------|
| English  | `en`  | `en.ts`      | Global (default) |
| Simplified Chinese | `zh-CN` | ``zh-cn.ts`` | Mainland China |
| Traditional Chinese | `zh-TW` | `zh-tw.ts` | Hong Kong/Taiwan |

### Language Detection & Switching

- Auto-detect from `navigator.language` on first visit
- Persist selection in `localStorage` key `worldmonitor-locale`
- Dropdown switcher in page header for manual selection
- No page reload needed when switching languages

## Bash Guidelines

### IMPORTANT: Avoid commands that cause output buffering issues
- DO NOT pipe output through `head`, `tail`, `less`, or `more` when monitoring or checking command output
- DO NOT use `| head -n X` or `| tail -n X` to truncate output - these cause buffering problems
- Instead, let commands complete fully, or use `--max-lines` flags if the command supports them
- For log monitoring, prefer reading files directly rather than piping through filters

### When checking command output:
- Run commands directly without pipes when possible
- If you need to limit output, use command-specific flags (e.g., `git log -n 10` instead of `git log | head -10`)
- Avoid chained pipes that can cause output to buffer indefinitely

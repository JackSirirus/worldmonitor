## Context

**Current State:**
- Vite dev server runs on port 3000, backend Express server runs on port 3001
- Backend has `/api/health` endpoint returning `{status: 'ok', timestamp, uptime}`
- Current `vite.config.ts` has a disabled `checkLocalBackend()` function that always returns `false`
- Developers must manually set `VITE_USE_LOCAL_BACKEND=true` to route APIs to local backend
- No automatic detection or fallback mechanism exists

**Constraints:**
- Must not block Vite startup (async detection)
- Must maintain backward compatibility with existing external API proxies
- Must work on Windows, macOS, and Linux
- Detection should have reasonable timeout to avoid long waits

**Stakeholders:**
- Developers working on both frontend and backend simultaneously

## Goals / Non-Goals

**Goals:**
1. Automatically detect if local backend is running on port 3001
2. Route `/api/*` requests to local backend when detected
3. Fall back to external API proxies when backend is not running
4. Display proxy mode at Vite startup for clarity
5. Allow manual override via environment variable for testing

**Non-Goals:**
- Not implementing runtime detection (detection happens at startup only)
- Not modifying the backend server code (uses existing `/api/health`)
- Not adding new configuration files or complex setup
- Not supporting multiple backend instances (single backend only)

## Decisions

### Decision 1: Async Detection via configureServer Hook

**Choice:** Use Vite's `configureServer` hook with async detection and middleware-based proxy switching

**Implementation Approach:**
1. Default to external API proxies (existing config)
2. In `configureServer` hook, asynchronously check backend health
3. If backend detected, add middleware to intercept `/api/*` requests
4. Middleware proxies requests to local backend instead of using Vite's static proxy

**Rationale:**
- Vite's proxy config is static at startup, cannot be changed dynamically
- Middleware approach allows runtime switching based on detection result
- External proxies still available as fallback
- Minimal overhead - only adds middleware if backend detected

**Alternative Considered:** Sync detection with `require('http')` at config time
- Rejected: Doesn't work reliably at config time, poor error handling

### Decision 2: Health Check Endpoint

**Choice:** Use existing `/api/health` endpoint

**Rationale:**
- Already implemented in `server/index.ts`
- Returns JSON with status, easy to verify server is healthy
- Minimal overhead (lightweight response)

**Alternative Considered:** Check port availability via `net`
- Rejected: Port could be open but server not ready to handle requests

### Decision 3: Proxy Routing Strategy

**Choice:** Route ALL `/api/*` requests to local backend when detected

**Rationale:**
- Local backend (`server/index.ts`) already implements 40+ API routes
- Simplifies proxy configuration (single rule instead of many)
- Backend handles routing internally to external APIs
- Reduces CORS issues and simplifies debugging

**Alternative Considered:** Selective proxy (only specific routes to backend)
- Rejected: More complex configuration, easy to miss routes
- Note: If backend doesn't implement a route, it will return 404

### Decision 4: Timeout and Retry Strategy

**Choice:** 2-second timeout, single attempt

**Rationale:**
- Backend should respond quickly if running locally
- No need for retries at startup - either it's running or not
- 2 seconds is reasonable wait time without annoying developers

### Decision 5: Fallback Behavior

**Choice:** Always fall back to external proxies if backend not detected

**Rationale:**
- Developers can still work on frontend-only changes
- No need to have backend running for every development session
- Maintains current external API proxy configuration as default

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Backend starts slower than Vite | Set 2s timeout, proceed with external proxies if timeout |
| Windows firewall blocks localhost | Use 127.0.0.1 instead of localhost |
| Backend port configurable via env | Read from process.env.PORT \|\| 3001 |
| Detection runs on every startup | Only runs once at startup, cached for session |
| Backend missing some API routes | All 40+ routes already implemented in backend |
| External APIs unavailable when backend off | Fallback to external proxies for frontend-only work |

## Migration Plan

1. Modify `vite.config.ts`:
   - Replace `checkLocalBackend()` with async implementation
   - Update `createProxyConfig()` to use detection result
   - Add startup logging for proxy mode

2. No database or deployment changes needed

3. Rollback: Revert changes to `vite.config.ts` if issues arise

## Open Questions

- Should we display a warning if backend was previously running but now unavailable? (Low priority, skip for now)
- Should we cache detection result in memory to avoid repeated checks? (Not needed, detection is one-time at startup)

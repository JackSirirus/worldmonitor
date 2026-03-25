# Proposal: Auto-Detect Backend Proxy for Vite

## Why

Currently, the Vite development server requires manual configuration (`VITE_USE_LOCAL_BACKEND=true`) to route API requests to the local backend server. This creates friction during development - developers must remember to set the environment variable before starting Vite, and there's no automatic fallback when the backend isn't running. The backend server already has a `/api/health` endpoint, making automatic detection straightforward.

## What Changes

1. **Enable automatic backend detection** in `vite.config.ts` - replace the disabled `checkLocalBackend()` function with a working implementation
2. **Use async detection** via Vite's `configureServer` hook to avoid blocking server startup
3. **Implement smart fallback** - when local backend is detected, route `/api/*` to it; otherwise use existing external API proxies
4. **Add startup logging** - display which proxy mode is active at Vite startup
5. **Maintain backward compatibility** - allow manual override via `VITE_USE_LOCAL_BACKEND` env var for testing

## Capabilities

### New Capabilities

- `auto-backend-detection`: Automatically detect if local Express backend is running on port 3001 and route API requests accordingly, with external proxies as fallback

## Impact

- **Files modified**: `vite.config.ts`
- **Dependencies**: Uses existing `/api/health` endpoint (already implemented in `server/index.ts`)
- **No breaking changes**: External proxy configuration preserved as fallback

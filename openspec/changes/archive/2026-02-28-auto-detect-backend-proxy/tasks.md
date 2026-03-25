## 1. Implement Backend Detection

- [x] 1.1 Create async `checkLocalBackend()` function using Node.js http module
- [x] 1.2 Add 2-second timeout to prevent hanging
- [x] 1.3 Read backend port from `process.env.PORT || 3001`
- [x] 1.4 Handle connection errors gracefully (server not running, firewall, etc.)

## 2. Update Proxy Configuration

- [x] 2.1 Modify `createProxyConfig()` to use detection result
- [x] 2.2 Route ALL `/api/*` to local backend when detected (single proxy rule)
- [x] 2.3 Preserve external API proxies as fallback when backend not running
- [x] 2.4 Handle manual override via `VITE_USE_LOCAL_BACKEND` env var

## 3. Add Startup Logging

- [x] 3.1 Display detection status at Vite startup
- [x] 3.2 Show which proxy mode is active (local vs external)
- [x] 3.3 Include manual override notice if applicable

## 4. Testing

- [x] 4.1 Test with backend running - verify proxy routes to localhost:3001
- [x] 4.2 Test with backend not running - verify external proxies work
- [x] 4.3 Test manual override - verify environment variable takes precedence
- [x] 4.4 Test timeout behavior - verify Vite doesn't hang when backend is slow

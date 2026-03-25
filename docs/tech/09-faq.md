# WorldMonitor 常见问题

## 开发环境问题

### 1. 端口占用

**问题**: 启动服务器时报错 `EADDRINUSE: address already in use`

**解决方案**:

```bash
# Windows: 查找占用端口的进程
netstat -ano | findstr :3001

# 终止进程
taskkill /PID <PID> /F

# 或直接终止所有 node 进程
taskkill /F /IM node.exe
```

### 2. TypeScript 编译错误

**问题**: TypeScript 检查失败

**解决方案**:

```bash
# 运行类型检查
npm run typecheck

# 查看具体错误并修复
```

### 3. 模块导入错误

**问题**: `Cannot find module '@/utils/sanitize'`

**解决方案**:

检查 `tsconfig.json` 中的路径别名配置：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 数据获取问题

### 1. RSS 代理返回 403 错误

**问题**: `Error: HTTP 403 Domain not allowed`

**解决方案**:

新添加的 RSS 域名需要添加到白名单：

1. 打开 `api/rss-proxy.js`
2. 找到 `ALLOWED_DOMAINS` 数组
3. 添加新的域名

```javascript
const ALLOWED_DOMAINS = [
  // 现有域名
  'feeds.bbci.co.uk',
  // 添加新域名
  'www.example.com',
];
```

### 2. 数据库连接失败

**问题**: `Connection terminated unexpectedly`

**解决方案**:

1. 检查 PostgreSQL 服务是否运行
2. 验证 `DATABASE_URL` 格式正确
3. 确认数据库服务器可访问

### 3. Redis 缓存失败

**问题**: `Cache read failed: fetch failed`

**解决方案**:

1. 检查 Upstash Redis 服务状态
2. 验证 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 正确
3. 确认网络可以访问 Upstash

### 4. 外部 API 请求超时

**问题**: `ConnectTimeoutError`

**原因**: 本地开发环境网络限制，无法访问外部 API

**解决方案**:

- 这是本地开发环境的限制
- 部署到 Vercel/Railway 后可正常工作
- 或者配置代理

---

## AI 功能问题

### 1. AI 摘要不工作

**问题**: 调用摘要 API 返回错误

**解决方案**:

1. 确认已配置 API 密钥：
   - `GROQ_API_KEY` (推荐)
   - `OPENROUTER_API_KEY` (备用)

2. 检查 API 配额：
   - Groq 免费额度: 14,400 请求/天
   - 查看 https://console.groq.com

3. 验证 API 密钥有效

### 2. 摘要返回空结果

**问题**: 摘要 API 返回成功但内容为空

**解决方案**:

1. 检查请求的头条数据格式
2. 确认 Redis 缓存未过期
3. 查看服务器日志

---

## 部署问题

### 1. Vercel 部署失败

**问题**: 构建失败或部署错误

**解决方案**:

1. 检查构建命令是否正确
2. 确认输出目录为 `dist`
3. 查看 Vercel 构建日志

### 2. 静态资源 404

**问题**: CSS/JS 文件返回 404

**解决方案**:

1. 确认 `npm run build` 成功
2. 检查 `dist` 目录存在
3. 验证 `vite.config.ts` 输出配置

### 3. API 请求失败

**问题**: 前端无法调用后端 API

**解决方案**:

1. 检查后端服务运行状态
2. 确认 CORS 配置正确
3. 验证 API 基础 URL

---

## 前端问题

### 1. 地图不显示

**问题**: 地图区域为空白

**解决方案**:

1. 检查浏览器控制台错误
2. 确认 MapLibre GL 加载成功
3. 检查地图样式 URL 配置

### 2. 面板加载缓慢

**问题**: 某些面板加载时间过长

**解决方案**:

1. 检查网络请求状态
2. 查看是否有 API 超时
3. 考虑添加加载状态

### 3. 语言切换不生效

**问题**: 切换语言后 UI 未更新

**解决方案**:

1. 检查 localStorage 中的语言设置
2. 确认翻译键存在
3. 刷新页面重试

---

## 性能问题

### 1. 内存占用高

**问题**: 浏览器内存占用持续增长

**解决方案**:

1. 关闭不必要的浏览器标签页
2. 清除浏览器缓存
3. 重启开发服务器

### 2. 构建时间过长

**问题**: `npm run build` 耗时过长

**解决方案**:

1. 使用增量构建
2. 检查是否有大型依赖
3. 考虑代码分割

---

## 安全问题

### 1. API 密钥泄露

**问题**: 不小心提交了 API 密钥

**解决方案**:

1. 立即更换泄露的密钥
2. 使用环境变量而非硬编码
3. 检查 .gitignore 配置

### 2. CORS 错误

**问题**: 跨域请求被阻止

**解决方案**:

在服务器端配置 CORS：

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
```

---

## 其他问题

### 1. 如何查看日志？

**前端**:

- 打开浏览器开发者工具 (F12)
- 查看 Console 和 Network 标签

**后端**:

```bash
# 开发模式
cd server
npm run dev

# 查看 Railway 日志
railway logs
```

### 2. 如何添加新的 RSS 源？

1. 在 `src/config/feeds.ts` 添加源
2. 在 `api/rss-proxy.js` 添加域名到白名单
3. 重新部署

### 3. 如何添加新的面板？

1. 创建组件文件：`src/components/NewPanel.ts`
2. 在 `src/components/index.ts` 导出
3. 在 `src/config/panels.ts` 配置
4. 在 `src/App.ts` 添加到布局

### 4. 如何联系支持？

- GitHub Issues: https://github.com/koala73/worldmonitor/issues
- 提交 Bug 报告时包含：
  - 错误信息
  - 复现步骤
  - 环境信息

---

## 已知限制

1. **本地开发网络限制**: 某些外部 API 在本地开发环境可能无法访问
2. **浏览器兼容性**: 需要现代浏览器支持 (Chrome 90+, Edge 90+)
3. **WebGL 要求**: 地图功能需要支持 WebGL

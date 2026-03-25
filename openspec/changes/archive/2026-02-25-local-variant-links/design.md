# Design: local-variant-links

## Context

当前应用头部有两个变体切换按钮 (WORLD / TECH)，用于切换地缘政治版本和科技版本。当用户在本地开发环境 (localhost) 点击这些按钮时，会跳转到外部生产域名，导致离开本地开发服务器。

当前代码逻辑：
- 在 `full` 变体时：TECH 按钮链接到 `https://tech.worldmonitor.app`
- 在 `tech` 变体时：WORLD 按钮链接到 `https://worldmonitor.app`
- 如果已经是当前变体，按钮 `href="#"` 不跳转

## Goals / Non-Goals

**Goals:**
- 在本地开发环境 (localhost) 下，点击变体按钮应跳转到对应的本地端口
- 保持生产环境行为不变，仍然跳转到外部域名

**Non-Goals:**
- 不修改变体切换的实际功能逻辑
- 不添加新的环境配置

## Decisions

### 决策 1: 如何检测本地开发环境

**选项 A: 检查 `window.location.hostname`**
- 如果是 `localhost` 或 `127.0.0.1`，认为是本地环境

**选项 B: 使用 Vite 环境变量**
- 在构建时注入 `import.meta.env.DEV` 判断

**选择: 选项 A**
浏览器运行时可以动态判断当前是否在本地环境，更加灵活。

### 决策 2: 本地端口映射

| 变体 | 本地启动命令 | 默认端口 |
|------|-------------|---------|
| full | `npm run dev` | 3000 |
| tech | `npm run dev:tech` | 3000 |

两个变体使用相同端口，通过不同的 `VITE_VARIANT` 环境变量区分。

**动态端口处理：** 使用 `window.location.port` 获取当前运行端口，确保链接指向正确端口。

### 决策 3: 链接格式

开发环境：
- 使用 `window.location.port` 获取当前端口
- WORLD 按钮: `http://localhost:{port}/?variant=full&{existing_params}`
- TECH 按钮: `http://localhost:{port}/?variant=tech&{existing_params}`

保留现有 URL 参数（lang, lat, lon, zoom 等）。

## Risks / Trade-offs

**风险 1: URL 参数可能与现有参数冲突**
- 现有参数：`lang`, `lat`, `lon`, `zoom`, `view`, `timeRange`, `layers`
- 解决：
  - 如果 URL 已有 `?`，追加 `&variant=xxx`
  - 如果 URL 没有 `?`，使用 `?variant=xxx`
  - 示例：`?lang=zh-CN&variant=tech` 或 `?variant=tech`

**风险 2: 页面需要刷新才能切换变体**
- 因为 `SITE_VARIANT` 是编译时常量
- 解决：在 App 初始化时检查 URL 参数，优先使用参数值

**权衡: URL 参数方式 vs 启动两个端口**
- 优点：不需要同时运行两个服务器
- 缺点：需要刷新页面
- 选择：当前方案更简单，适合开发调试使用

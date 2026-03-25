# Proposal: local-variant-links

## Why

当前 WORLD/TECH 变体切换按钮硬编码指向外部域名 (worldmonitor.app / tech.worldmonitor.app)，导致本地开发时无法方便地测试两个变体。每次切换都会离开本地服务器，需要重新通过不同命令启动。

## What Changes

- 修改 App.ts 中的变体切换按钮链接
- 当检测到本地开发环境时，改为指向 localhost 端口
- 保持生产环境仍然指向外部域名

## Capabilities

### New Capabilities
- `local-dev-links`: 本地开发环境下的变体切换链接重定向

### Modified Capabilities
- 无

## Impact

- 修改文件：`src/App.ts`
- 需要根据当前环境变量判断是否为本地开发
- 需要确定 tech 变体对应的本地端口（默认 3000，通过 npm run dev:tech 启动）

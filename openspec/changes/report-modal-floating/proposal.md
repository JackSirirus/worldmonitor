## Why

日报详情目前以侧边栏内嵌方式显示，当用户点击报告列表项时，详情直接替换侧边栏内容。这种方式存在以下问题：

1. **体验割裂**：侧边栏宽度有限，报告内容阅读体验差
2. **无法对比**：无法同时查看多个报告进行对比
3. **遮挡内容**：侧边栏展开时会遮挡主内容区域

将报告详情改为中央悬浮弹窗显示，可以提供更好的阅读体验，同时保持侧边栏报告列表的可用性。

## What Changes

- **新增 ReportModal 组件**：创建独立的悬浮弹窗组件，负责报告详情的展示
- **修改 ReportPanel 点击行为**：移除原有的内嵌详情显示，改为调用 ReportModal 弹窗
- **添加 ESC 关闭支持**：按 ESC 键可关闭弹窗
- **添加点击遮罩关闭**：点击弹窗外部区域可关闭

## Capabilities

### New Capabilities

- `report-modal`: 悬浮弹窗显示报告详情
  - 弹窗以固定定位显示在页面中央
  - 支持 Markdown 内容渲染
  - 支持关闭按钮、ESC 键、遮罩点击三种关闭方式
  - 弹窗最大宽度 800px，最大高度 80vh，支持内容滚动

## Impact

### 受影响代码
- `src/components/layout/ReportPanel.ts` — 修改点击事件处理，移除内嵌详情渲染
- `src/styles/report.css` — 添加弹窗样式

### 新增文件
- `src/components/layout/ReportModal.ts` — 悬浮弹窗组件

### 无破坏性变更
此为纯 UI 改进，不影响 API 和数据模型

## Context

当前日报详情在 `ReportPanel` 组件的侧边栏内嵌显示。当用户点击报告项时，`renderCurrentReport()` 方法将详情 HTML 直接注入侧边栏，替换列表视图。这种实现有以下问题：

- 侧边栏宽度 300-400px 不适合阅读长文本
- 用户无法同时查看报告列表和详情
- 无良好的移动端适配

## Goals / Non-Goals

**Goals:**
- 提供沉浸式的报告阅读体验
- 保持报告列表始终可见
- 支持键盘（ESC）和鼠标（点击遮罩）关闭

**Non-Goals:**
- 不修改报告数据模型或 API
- 不添加报告分享或导出功能

## Decisions

### Decision 1: 独立弹窗组件 vs 修改现有组件

**选择：独立弹窗组件（ReportModal）**

| 方案 | 优点 | 缺点 |
|------|------|------|
| 独立组件 | 职责清晰、可复用、不污染 ReportPanel | 多一个文件 |
| 修改 ReportPanel | 改动小 | 耦合严重、难以维护 |

### Decision 2: 弹窗实现方式

**选择：原生 DOM + CSS 固定定位**

```typescript
class ReportModal {
  private overlay: HTMLElement;
  private modal: HTMLElement;

  show(report: Report): void {
    // 创建遮罩层和弹窗（如果不存在）
    // 渲染内容
    // 添加到 body
    document.body.appendChild(this.overlay);
  }

  hide(): void {
    this.overlay.remove();
  }
}
```

不使用现有 Modal 框架（如有），保持轻量级实现。

### Decision 3: 内容渲染

**选择：直接渲染 Markdown 文本**

报告内容已是 Markdown 格式，直接使用 `<pre>` 或简单 HTML 渲染，不引入额外解析库。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 弹窗遮挡重要内容 | 弹窗使用半透明遮罩，用户仍可感知上下文 |
| 移动端体验差 | 弹窗宽度使用百分比（90%）适配小屏幕 |
| 多弹窗冲突 | 使用单例模式，确保同一时间只有一个弹窗 |

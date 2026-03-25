# WorldMonitor 开发规范

## 代码风格

### TypeScript 规范

#### 命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `tech-events-panel.ts` |
| 类名 | PascalCase | `class AgentPanel` |
| 接口名 | PascalCase | `interface TechEvent` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRIES = 3` |
| 变量/函数 | camelCase | `getElement()` |
| 私有属性 | _camelCase | `private _element` |

#### 类型定义

```typescript
// 使用 interface 定义对象类型
interface User {
  id: number;
  name: string;
  email: string;
}

// 使用 type 定义联合类型
type Status = 'loading' | 'success' | 'error';

// 使用 readonly 保护不可变属性
interface Config {
  readonly apiKey: string;
}
```

#### 导入规范

```typescript
// 导入顺序：外部库 -> 内部模块 -> 类型

// 1. React/Vue 等框架（如果有）
import { useState, useEffect } from 'react';

// 2. 第三方库
import { escapeHtml, sanitizeUrl } from '@/utils/sanitize';
import { t } from '@/i18n';

// 3. 内部模块
import { Panel } from './Panel';
import { Map } from './Map';

// 4. 类型导入
import type { TechEvent } from '@/types/events';
```

### CSS 规范

#### 命名规范

使用 BEM 命名法：

```css
/* Block */
.panel { }

/* Element */
.panel-header { }
.panel-content { }

/* Modifier */
.panel--active { }
.panel-header--collapsed { }
```

#### CSS 变量

```css
:root {
  --color-primary: #ff6b35;
  --color-background: #1a1a1a;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}
```

## Git 工作流

### 分支策略

| 分支 | 用途 | 命名规则 |
|------|------|----------|
| main | 生产分支 | - |
| beta | 测试分支 | - |
| feature/* | 新功能 | feature/feature-name |
| bugfix/* | Bug 修复 | bugfix/bug-description |
| hotfix/* | 紧急修复 | hotfix/issue-description |

### 提交规范

使用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型

| 类型 | 描述 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 格式调整 |
| refactor | 代码重构 |
| test | 测试相关 |
| chore | 构建/工具 |

#### 示例

```
feat(agent): add report generation feature

- Add tech report generation
- Add world report generation
- Add weekly report generation

Closes #123
```

### 提交步骤

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发并提交
git add src/components/NewComponent.ts
git commit -m "feat: add new component"

# 3. 推送分支
git push origin feature/new-feature

# 4. 创建 Pull Request
```

## i18n 国际化规范

### 目录结构

```
src/i18n/
├── locales/
│   ├── en.ts       # 英语
│   ├── zh-cn.ts    # 简体中文
│   └── zh-tw.ts    # 繁体中文
└── index.ts        # 入口
```

### 翻译键命名

使用嵌套命名空间：

```typescript
// 好的命名
{
  "common": {
    "loading": "Loading",
    "error": "Error"
  },
  "panels": {
    "agent": "Agent",
    "markets": "Markets"
  },
  "buttons": {
    "refresh": "Refresh",
    "close": "Close"
  }
}

// 避免
{
  "loadingText": "Loading",
  "panelName": "Agent"
}
```

### 在代码中使用

```typescript
import { t } from '@/i18n';

// 简单使用
const title = t('panels.agent');

// 带参数
const message = t('messages.itemsCount', { count: 5 });
// "5 items"
```

### 添加新翻译

1. 在所有语言文件中添加相同的键
2. 英文作为默认值
3. 保持键的层次结构

```typescript
// src/i18n/locales/en.ts
export default {
  common: {
    loading: 'Loading'
  }
};

// src/i18n/locales/zh-cn.ts
export default {
  common: {
    loading: '加载中'
  }
};
```

## 组件开发规范

### 创建新面板组件

```typescript
// src/components/NewPanel.ts

import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import { t } from '@/i18n';

interface NewPanelData {
  id: string;
  name: string;
}

export class NewPanel extends Panel {
  private data: NewPanelData[] = [];

  constructor(id: string) {
    super({
      id,
      title: t('panels.newPanel'),
      titleKey: 'panels.newPanel',
      showCount: true
    });

    this.element.classList.add('panel-tall');
    void this.fetchData();
  }

  private async fetchData(): Promise<void> {
    try {
      const res = await fetch('/api/new-data');
      const json = await res.json();
      this.data = json.data || [];
      this.setCount(this.data.length);
      this.render();
    } catch (error) {
      console.error('[NewPanel] Fetch error:', error);
    }
  }

  protected render(): void {
    this.content.innerHTML = `
      <div class="new-panel-list">
        ${this.data.map(item => `
          <div class="new-panel-item">
            ${escapeHtml(item.name)}
          </div>
        `).join('')}
      </div>
    `;
  }

  public refresh(): void {
    void this.fetchData();
  }
}
```

### 创建 API 路由

```typescript
// server/routes/new-api.ts

import { Router } from 'express';

const router = Router();

router.get('/api/new-data', async (req, res) => {
  try {
    const data = await fetchExternalData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('[NewAPI] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch data' });
  }
});

export default router;
```

## 测试规范

### 单元测试

使用 Vitest：

```typescript
import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  it('should escape HTML', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });
});
```

### E2E 测试

使用 Playwright：

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('.logo')).toContainText('MONITOR');
});
```

## 性能规范

### 前端性能

- 使用 Web Workers 进行密集计算
- 懒加载非关键组件
- 图片和静态资源使用 CDN
- 启用代码分割

### 后端性能

- 使用 Redis 缓存 API 响应
- 实现请求频率限制
- 数据库查询使用连接池
- 启用 gzip 压缩

## 代码审查清单

### 提交前检查

- [ ] TypeScript 类型检查通过 (`npm run typecheck`)
- [ ] 构建成功 (`npm run build`)
- [ ] 无 console.log (调试代码)
- [ ] 所有翻译键已添加

### 代码审查要点

- [ ] 代码遵循命名规范
- [ ] 错误处理完善
- [ ] 性能考虑
- [ ] 安全检查
- [ ] 文档注释（复杂逻辑）

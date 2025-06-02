# UI组件库设计规范

## 1. 设计系统概述

### 1.1 设计原则
- **一致性**：确保所有组件在视觉和交互上保持一致
- **可用性**：组件易于理解和使用
- **可访问性**：支持无障碍访问
- **可扩展性**：组件可以灵活组合和扩展
- **响应式**：适配不同屏幕尺寸

### 1.2 设计令牌 (Design Tokens)

```css
/* 颜色系统 */
:root {
  /* 主色调 */
  --primary-50: #e6f7ff;
  --primary-100: #bae7ff;
  --primary-200: #91d5ff;
  --primary-300: #69c0ff;
  --primary-400: #40a9ff;
  --primary-500: #1890ff;
  --primary-600: #096dd9;
  --primary-700: #0050b3;
  --primary-800: #003a8c;
  --primary-900: #002766;
  
  /* 中性色 */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #f0f0f0;
  --gray-300: #d9d9d9;
  --gray-400: #bfbfbf;
  --gray-500: #8c8c8c;
  --gray-600: #595959;
  --gray-700: #434343;
  --gray-800: #262626;
  --gray-900: #1f1f1f;
  
  /* 语义色 */
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --info-color: #1890ff;
  
  /* 文本颜色 */
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-tertiary: #8c8c8c;
  --text-disabled: #bfbfbf;
  --text-inverse: #ffffff;
  
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  --bg-disabled: #f5f5f5;
  
  /* 边框色 */
  --border-primary: #d9d9d9;
  --border-secondary: #f0f0f0;
  --border-focus: #40a9ff;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-base: 0 1px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  /* 字体 */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
  
  /* 字重 */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-base: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-base: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* 动画 */
  --duration-fast: 0.15s;
  --duration-base: 0.3s;
  --duration-slow: 0.5s;
  --easing-ease: ease;
  --easing-ease-in: ease-in;
  --easing-ease-out: ease-out;
  --easing-ease-in-out: ease-in-out;
}
```

## 2. 基础组件

### 2.1 按钮组件 (Button)

#### 设计规范
```
┌─────────────────────────────────────┐
│ 主要按钮 (Primary)                   │
│ ┌─────────────┐ ┌─────────────┐     │
│ │    确认     │ │    取消     │     │
│ └─────────────┘ └─────────────┘     │
│                                     │
│ 次要按钮 (Secondary)                 │
│ ┌─────────────┐ ┌─────────────┐     │
│ │    编辑     │ │    删除     │     │
│ └─────────────┘ └─────────────┘     │
│                                     │
│ 文本按钮 (Text)                     │
│ [查看详情] [了解更多]                │
│                                     │
│ 图标按钮 (Icon)                     │
│ [🔍] [⚙️] [📤]                      │
└─────────────────────────────────────┘
```

#### 样式实现
```css
/* 按钮基础样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid transparent;
  border-radius: var(--radius-base);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--duration-base) var(--easing-ease-in-out);
  user-select: none;
  white-space: nowrap;
}

.btn:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 按钮尺寸 */
.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.btn-lg {
  padding: var(--spacing-base) var(--spacing-lg);
  font-size: var(--font-size-lg);
}

/* 按钮变体 */
.btn-primary {
  background: var(--primary-500);
  color: var(--text-inverse);
  border-color: var(--primary-500);
}

.btn-primary:hover {
  background: var(--primary-600);
  border-color: var(--primary-600);
}

.btn-primary:active {
  background: var(--primary-700);
  border-color: var(--primary-700);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-500);
  color: var(--primary-500);
}

.btn-text {
  background: transparent;
  color: var(--primary-500);
  border-color: transparent;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.btn-text:hover {
  background: var(--primary-50);
}

.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.btn-icon:hover {
  background: var(--primary-50);
  color: var(--primary-500);
}

/* 危险按钮 */
.btn-danger {
  background: var(--error-color);
  color: var(--text-inverse);
  border-color: var(--error-color);
}

.btn-danger:hover {
  background: #ff7875;
  border-color: #ff7875;
}
```

### 2.2 输入框组件 (Input)

#### 设计规范
```
┌─────────────────────────────────────┐
│ 基础输入框                           │
│ ┌─────────────────────────────────┐ │
│ │ 请输入内容...                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 带标签输入框                         │
│ 用户名                               │
│ ┌─────────────────────────────────┐ │
│ │ 请输入用户名                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 带图标输入框                         │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 搜索...                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 错误状态                             │
│ ┌─────────────────────────────────┐ │
│ │ 输入内容有误                     │ │
│ └─────────────────────────────────┘ │
│ ⚠️ 请输入正确的格式                  │
└─────────────────────────────────────┘
```

#### 样式实现
```css
/* 输入框基础样式 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: all var(--duration-base) var(--easing-ease-in-out);
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.input:disabled {
  background: var(--bg-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* 输入框尺寸 */
.input-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.input-lg {
  padding: var(--spacing-base) var(--spacing-lg);
  font-size: var(--font-size-lg);
}

/* 带图标的输入框 */
.input-with-icon {
  padding-left: 40px;
}

.input-icon {
  position: absolute;
  left: var(--spacing-sm);
  color: var(--text-tertiary);
  pointer-events: none;
}

/* 错误状态 */
.input-error {
  border-color: var(--error-color);
}

.input-error:focus {
  border-color: var(--error-color);
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}

.input-error-message {
  font-size: var(--font-size-sm);
  color: var(--error-color);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 成功状态 */
.input-success {
  border-color: var(--success-color);
}

.input-success:focus {
  border-color: var(--success-color);
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}
```

### 2.3 卡片组件 (Card)

#### 设计规范
```
┌─────────────────────────────────────┐
│ 基础卡片                             │
│ ┌─────────────────────────────────┐ │
│ │ 卡片标题                         │ │
│ │ ─────────────────────────────── │ │
│ │ 这里是卡片的内容区域，可以包含   │ │
│ │ 文本、图片、按钮等各种元素。     │ │
│ │                                 │ │
│ │              [操作按钮]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 带头像的卡片                         │
│ ┌─────────────────────────────────┐ │
│ │ [👤] 用户名称    [时间戳]        │ │
│ │ ─────────────────────────────── │ │
│ │ 用户发送的消息内容...            │ │
│ │                                 │ │
│ │ [👍] [💬] [📤]                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 样式实现
```css
/* 卡片基础样式 */
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all var(--duration-base) var(--easing-ease-in-out);
}

.card:hover {
  box-shadow: var(--shadow-base);
}

.card-header {
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

.card-body {
  padding: var(--spacing-lg);
}

.card-footer {
  padding: var(--spacing-base) var(--spacing-lg);
  border-top: 1px solid var(--border-secondary);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* 卡片变体 */
.card-bordered {
  border: 1px solid var(--border-primary);
}

.card-shadow {
  box-shadow: var(--shadow-lg);
}

.card-hoverable {
  cursor: pointer;
}

.card-hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.user-meta {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.user-content {
  margin: var(--spacing-sm) 0;
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}

.user-actions {
  display: flex;
  gap: var(--spacing-base);
  margin-top: var(--spacing-sm);
}
```

### 2.4 消息气泡组件 (Message Bubble)

#### 设计规范
```
┌─────────────────────────────────────┐
│ 接收消息                             │
│ ┌─────────────────────────────────┐ │
│ │ 您好，我是客服小李，很高兴为您   │ │
│ │ 服务！请问有什么可以帮助您的？   │ │
│ └─────────────────────────────────┘ │
│ 10:30                               │
│                                     │
│ 发送消息                             │
│                 ┌─────────────────┐ │
│                 │ 我想了解一下产品 │ │
│                 │ 的相关信息       │ │
│                 └─────────────────┘ │
│                               10:32 │
│                                     │
│ 系统消息                             │
│        [客服 小李 已加入对话]        │
│                 10:28               │
└─────────────────────────────────────┘
```

#### 样式实现
```css
/* 消息容器 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
}

.message-item {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  max-width: 80%;
}

.message-item.sent {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-item.received {
  align-self: flex-start;
}

.message-item.system {
  align-self: center;
  max-width: none;
}

/* 消息头像 */
.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* 消息内容 */
.message-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.message-bubble {
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  word-wrap: break-word;
  position: relative;
}

/* 接收消息样式 */
.message-item.received .message-bubble {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-secondary);
  border-bottom-left-radius: var(--radius-sm);
}

.message-item.received .message-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  bottom: 8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 8px 8px 0;
  border-color: transparent var(--bg-primary) transparent transparent;
}

/* 发送消息样式 */
.message-item.sent .message-bubble {
  background: var(--primary-500);
  color: var(--text-inverse);
  border-bottom-right-radius: var(--radius-sm);
}

.message-item.sent .message-bubble::before {
  content: '';
  position: absolute;
  right: -8px;
  bottom: 8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 8px 8px;
  border-color: transparent transparent var(--primary-500) transparent;
}

/* 系统消息样式 */
.message-item.system .message-bubble {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
  border-radius: var(--radius-full);
}

/* 消息时间 */
.message-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: var(--spacing-xs);
}

.message-item.sent .message-time {
  text-align: right;
}

.message-item.system .message-time {
  text-align: center;
}

/* 消息状态 */
.message-status {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-icon {
  width: 12px;
  height: 12px;
}

.status-sending {
  color: var(--warning-color);
}

.status-sent {
  color: var(--success-color);
}

.status-failed {
  color: var(--error-color);
}
```

## 3. 复合组件

### 3.1 导航栏组件 (Navigation)

#### 样式实现
```css
/* 顶部导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-decoration: none;
}

.navbar-logo {
  width: 32px;
  height: 32px;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-base);
  transition: all var(--duration-base) var(--easing-ease-in-out);
}

.nav-link:hover {
  background: var(--bg-secondary);
  color: var(--primary-500);
}

.nav-link.active {
  background: var(--primary-50);
  color: var(--primary-500);
}

/* 侧边导航栏 */
.sidebar {
  width: 240px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-secondary);
  height: 100vh;
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  transition: transform var(--duration-base) var(--easing-ease-in-out);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-secondary);
}

.sidebar-nav {
  padding: var(--spacing-base) 0;
}

.sidebar-nav-item {
  display: block;
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--duration-base) var(--easing-ease-in-out);
  border-left: 3px solid transparent;
}

.sidebar-nav-item:hover {
  background: var(--bg-secondary);
  color: var(--primary-500);
}

.sidebar-nav-item.active {
  background: var(--primary-50);
  color: var(--primary-500);
  border-left-color: var(--primary-500);
}

.nav-icon {
  width: 20px;
  height: 20px;
  margin-right: var(--spacing-sm);
}

.sidebar.collapsed .nav-text {
  display: none;
}
```

### 3.2 模态框组件 (Modal)

#### 样式实现
```css
/* 模态框遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-base) var(--easing-ease-in-out);
}

.modal-overlay.show {
  opacity: 1;
  visibility: visible;
}

/* 模态框容器 */
.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  transform: scale(0.9);
  transition: transform var(--duration-base) var(--easing-ease-in-out);
}

.modal-overlay.show .modal {
  transform: scale(1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-secondary);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-base);
  transition: all var(--duration-base) var(--easing-ease-in-out);
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-secondary);
  background: var(--bg-secondary);
}

/* 模态框尺寸 */
.modal-sm {
  width: 400px;
}

.modal-md {
  width: 600px;
}

.modal-lg {
  width: 800px;
}

.modal-xl {
  width: 1200px;
}
```

### 3.3 表格组件 (Table)

#### 样式实现
```css
/* 表格容器 */
.table-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-base);
}

.table th,
.table td {
  padding: var(--spacing-base);
  text-align: left;
  border-bottom: 1px solid var(--border-secondary);
}

.table th {
  background: var(--bg-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  position: sticky;
  top: 0;
  z-index: 10;
}

.table td {
  color: var(--text-primary);
}

.table tbody tr:hover {
  background: var(--bg-secondary);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* 表格操作列 */
.table-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* 表格状态 */
.table-status {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.table-status.online {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-color);
}

.table-status.offline {
  background: rgba(140, 140, 140, 0.1);
  color: var(--text-tertiary);
}

.table-status.busy {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-color);
}

/* 响应式表格 */
@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
  }
  
  .table {
    min-width: 600px;
  }
}
```

## 4. 状态组件

### 4.1 加载状态

```css
/* 加载动画 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-secondary);
  border-top: 3px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-left: var(--spacing-base);
  color: var(--text-secondary);
}

/* 骨架屏 */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--border-secondary) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: var(--radius-base);
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 1em;
  margin-bottom: var(--spacing-xs);
}

.skeleton-text:last-child {
  margin-bottom: 0;
  width: 60%;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-button {
  height: 40px;
  width: 100px;
}
```

### 4.2 空状态

```css
/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-description {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
  max-width: 400px;
  line-height: var(--line-height-normal);
}

.empty-action {
  margin-top: var(--spacing-base);
}
```

## 5. 响应式设计

### 5.1 断点系统

```css
/* 断点定义 */
:root {
  --breakpoint-xs: 480px;
  --breakpoint-sm: 768px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1280px;
  --breakpoint-xl: 1536px;
}

/* 响应式工具类 */
@media (max-width: 767px) {
  .hidden-mobile {
    display: none !important;
  }
  
  .mobile-only {
    display: block !important;
  }
}

@media (min-width: 768px) {
  .mobile-only {
    display: none !important;
  }
  
  .hidden-desktop {
    display: none !important;
  }
}

/* 响应式网格 */
.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.grid-cols-1 {
  grid-template-columns: repeat(1, 1fr);
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1023px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .grid-cols-4,
  .grid-cols-3,
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
```

## 6. 主题系统

### 6.1 深色主题

```css
/* 深色主题 */
[data-theme="dark"] {
  --primary-500: #1890ff;
  --text-primary: #ffffff;
  --text-secondary: #a6a6a6;
  --text-tertiary: #737373;
  --text-disabled: #525252;
  --bg-primary: #1f1f1f;
  --bg-secondary: #262626;
  --bg-tertiary: #404040;
  --bg-disabled: #404040;
  --border-primary: #404040;
  --border-secondary: #262626;
  --border-focus: #40a9ff;
}

/* 主题切换动画 */
* {
  transition: background-color var(--duration-base) var(--easing-ease-in-out),
              border-color var(--duration-base) var(--easing-ease-in-out),
              color var(--duration-base) var(--easing-ease-in-out);
}
```

### 6.2 主题切换器

```css
.theme-switcher {
  position: relative;
  width: 48px;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--duration-base) var(--easing-ease-in-out);
}

.theme-switcher::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--bg-primary);
  border-radius: 50%;
  transition: transform var(--duration-base) var(--easing-ease-in-out);
}

[data-theme="dark"] .theme-switcher {
  background: var(--primary-500);
}

[data-theme="dark"] .theme-switcher::before {
  transform: translateX(24px);
}
```

这个组件库设计规范提供了完整的UI组件系统，包括设计令牌、基础组件、复合组件、状态组件、响应式设计和主题系统。所有组件都遵循一致的设计原则，确保整个应用的视觉和交互体验保持统一。
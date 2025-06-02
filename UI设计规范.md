# 微信小程序客服系统 - UI设计规范

## 1. 设计原则

### 1.1 核心设计理念
- **简洁高效**：界面简洁明了，操作流程高效便捷
- **一致性**：保持视觉和交互的一致性体验
- **易用性**：符合用户习惯，降低学习成本
- **专业性**：体现客服系统的专业性和可信度

### 1.2 设计系统

#### 色彩规范
```css
/* 主色调 */
--primary-color: #1890ff;      /* 主蓝色 */
--primary-light: #40a9ff;      /* 浅蓝色 */
--primary-dark: #096dd9;       /* 深蓝色 */

/* 辅助色 */
--success-color: #52c41a;      /* 成功绿 */
--warning-color: #faad14;      /* 警告橙 */
--error-color: #f5222d;        /* 错误红 */
--info-color: #13c2c2;         /* 信息青 */

/* 中性色 */
--text-primary: #262626;       /* 主文本 */
--text-secondary: #595959;     /* 次要文本 */
--text-disabled: #bfbfbf;      /* 禁用文本 */
--border-color: #d9d9d9;       /* 边框色 */
--background-color: #f5f5f5;   /* 背景色 */
--white: #ffffff;              /* 纯白 */
```

#### 字体规范
```css
/* 字体大小 */
--font-size-xs: 10px;          /* 极小 */
--font-size-sm: 12px;          /* 小 */
--font-size-base: 14px;        /* 基础 */
--font-size-lg: 16px;          /* 大 */
--font-size-xl: 18px;          /* 特大 */
--font-size-xxl: 20px;         /* 超大 */

/* 字体粗细 */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-bold: 600;
```

#### 间距规范
```css
/* 间距系统 */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-base: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-xxl: 24px;
--spacing-xxxl: 32px;
```

#### 圆角规范
```css
/* 圆角 */
--border-radius-sm: 4px;
--border-radius-base: 6px;
--border-radius-lg: 8px;
--border-radius-xl: 12px;
```

## 2. 组件设计规范

### 2.1 按钮组件

#### 主要按钮
```css
.btn-primary {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius-base);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.btn-primary:hover {
  background: var(--primary-light);
}

.btn-primary:active {
  background: var(--primary-dark);
}
```

#### 次要按钮
```css
.btn-secondary {
  background: var(--white);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-sm) var(--spacing-lg);
}
```

### 2.2 输入框组件
```css
.input-field {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-base);
  font-size: var(--font-size-base);
  background: var(--white);
}

.input-field:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
```

### 2.3 消息气泡组件
```css
/* 用户消息气泡 */
.message-bubble-user {
  background: var(--primary-color);
  color: var(--white);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) var(--border-radius-sm) var(--border-radius-lg);
  padding: var(--spacing-base) var(--spacing-lg);
  max-width: 70%;
  margin-left: auto;
}

/* 客服消息气泡 */
.message-bubble-staff {
  background: var(--white);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) var(--border-radius-lg) var(--border-radius-sm);
  padding: var(--spacing-base) var(--spacing-lg);
  max-width: 70%;
}
```

## 3. 图标设计规范

### 3.1 图标库
- 使用统一的图标库（推荐 Feather Icons 或 Ant Design Icons）
- 图标大小：16px、20px、24px
- 图标颜色：与文本颜色保持一致

### 3.2 常用图标
- 发送：send
- 图片：image
- 语音：mic
- 表情：smile
- 更多：more-horizontal
- 返回：arrow-left
- 设置：settings
- 搜索：search

## 4. 响应式设计规范

### 4.1 断点设置
```css
/* 小程序屏幕适配 */
@media (max-width: 375px) {
  /* iPhone SE */
}

@media (min-width: 376px) and (max-width: 414px) {
  /* iPhone 标准尺寸 */
}

@media (min-width: 415px) {
  /* iPhone Plus/Max */
}
```

### 4.2 PC端断点
```css
/* PC端响应式 */
@media (min-width: 768px) {
  /* 平板 */
}

@media (min-width: 1024px) {
  /* 桌面 */
}

@media (min-width: 1440px) {
  /* 大屏桌面 */
}
```
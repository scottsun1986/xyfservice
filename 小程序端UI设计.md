# 微信小程序端 - UI界面设计

## 1. 客户端界面设计

### 1.1 首页（index）

#### 页面结构
```
┌─────────────────────────────────────┐
│              状态栏                  │
├─────────────────────────────────────┤
│  [Logo]     客服咨询系统      [设置] │ ← 顶部导航
├─────────────────────────────────────┤
│                                     │
│     ┌─────────────────────────┐     │
│     │     欢迎使用客服系统     │     │ ← 欢迎卡片
│     │   我们将为您提供专业服务  │     │
│     └─────────────────────────┘     │
│                                     │
│     ┌─────────────────────────┐     │
│     │  📢 系统公告             │     │ ← 系统公告
│     │  今日客服在线时间：9-18点 │     │
│     └─────────────────────────┘     │
│                                     │
│     ┌─────────────────────────┐     │
│     │  💬 开始咨询             │     │ ← 咨询入口
│     │  点击进入在线客服         │     │
│     │           [立即咨询] ──→  │     │
│     └─────────────────────────┘     │
│                                     │
│     ┌─────────────────────────┐     │
│     │  🔔 消息推送             │     │ ← 推送订阅
│     │  订阅消息推送，及时接收回复│     │
│     │           [立即订阅] ──→  │     │
│     └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

#### 设计规范
```css
/* 首页样式 */
.index-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: var(--spacing-lg);
}

.welcome-card {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xxl);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feature-icon {
  font-size: 24px;
  margin-right: var(--spacing-base);
}

.action-button {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius-base);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
}
```

### 1.2 聊天页面（chat）

#### 页面结构
```
┌─────────────────────────────────────┐
│ [←] 客服小王 [●在线]        [⋯更多] │ ← 聊天头部
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────┐                │ ← 客服消息
│  │ 您好，有什么可以  │ 10:30          │
│  │ 帮助您的吗？     │                │
│  └─────────────────┘                │
│                                     │
│                ┌─────────────────┐  │ ← 用户消息
│         10:31  │ 我想了解一下产品  │  │
│                │ 的相关信息       │  │
│                └─────────────────┘  │
│                                     │
│  ┌─────────────────┐                │
│  │ 好的，请问您想了  │ 10:32          │
│  │ 解哪方面的信息？  │                │
│  └─────────────────┘                │
│                                     │
│  📝 客服正在输入中...                │ ← 输入状态
│                                     │
├─────────────────────────────────────┤
│ [😊] [📷] [🎤] [📍] [+]    [发送] │ ← 输入工具栏
│ ┌─────────────────────────────────┐ │
│ │ 请输入消息...                    │ │ ← 输入框
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 设计规范
```css
/* 聊天页面样式 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-color);
}

.chat-header {
  background: var(--white);
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.staff-info {
  display: flex;
  align-items: center;
}

.staff-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: var(--spacing-sm);
}

.staff-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.online-status {
  color: var(--success-color);
  font-size: var(--font-size-sm);
  margin-left: var(--spacing-xs);
}

.message-list {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.message-item {
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: flex-end;
}

.message-item.user {
  justify-content: flex-end;
}

.message-item.staff {
  justify-content: flex-start;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin: 0 var(--spacing-sm);
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  padding: var(--spacing-base) var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  line-height: 1.4;
  word-wrap: break-word;
}

.message-bubble.user {
  background: var(--primary-color);
  color: var(--white);
  border-bottom-right-radius: var(--border-radius-sm);
}

.message-bubble.staff {
  background: var(--white);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-bottom-left-radius: var(--border-radius-sm);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.typing-indicator {
  padding: var(--spacing-base) var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-style: italic;
}

.input-toolbar {
  background: var(--white);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-base);
}

.input-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.tool-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-sm) var(--spacing-base);
  font-size: var(--font-size-base);
  background: var(--background-color);
}

.send-button {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius-base);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
}
```

### 1.3 图片预览页面

#### 页面结构
```
┌─────────────────────────────────────┐
│ [×]                           [⋯]   │ ← 顶部操作栏
├─────────────────────────────────────┤
│                                     │
│                                     │
│            [图片内容]                │ ← 图片显示区
│                                     │
│                                     │
├─────────────────────────────────────┤
│     [保存到相册]    [转发]           │ ← 底部操作
└─────────────────────────────────────┘
```

## 2. 客服端界面设计

### 2.1 客服登录页面

#### 页面结构
```
┌─────────────────────────────────────┐
│                                     │
│              [Logo]                 │
│           客服工作台                 │
│                                     │
│     ┌─────────────────────────┐     │
│     │                         │     │
│     │  ┌─────────────────┐    │     │
│     │  │ 工号            │    │     │ ← 登录表单
│     │  └─────────────────┘    │     │
│     │                         │     │
│     │  ┌─────────────────┐    │     │
│     │  │ 密码            │    │     │
│     │  └─────────────────┘    │     │
│     │                         │     │
│     │     [登录]              │     │
│     │                         │     │
│     │  ────── 或 ──────       │     │
│     │                         │     │
│     │   [微信授权登录]         │     │
│     │                         │     │
│     └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 客服工作台首页

#### 页面结构
```
┌─────────────────────────────────────┐
│ 客服工作台    [🔔3]    [👤] [设置]   │ ← 顶部导航
├─────────────────────────────────────┤
│                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ 待处理   │ │ 进行中   │ │ 今日完成 │ │ ← 数据概览
│ │   12    │ │   5     │ │   28    │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│ 咨询列表                    [🔍搜索] │ ← 列表标题
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [👤] 张三        [●] 2分钟前     │ │ ← 咨询项
│ │ 我想了解一下产品...              │ │
│ │                           [3]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [👤] 李四        [○] 10分钟前    │ │
│ │ 价格是多少？                    │ │
│ │                           [1]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [👤] 王五        [●] 1小时前     │ │
│ │ 谢谢，问题解决了                │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

#### 设计规范
```css
/* 客服工作台样式 */
.workbench-container {
  background: var(--background-color);
  min-height: 100vh;
}

.workbench-header {
  background: var(--white);
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
}

.notification-badge {
  position: relative;
}

.badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--error-color);
  color: var(--white);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-overview {
  display: flex;
  gap: var(--spacing-base);
  padding: var(--spacing-lg);
}

.stat-card {
  flex: 1;
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
}

.stat-number {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.consultation-list {
  padding: 0 var(--spacing-lg);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);
}

.consultation-item {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-base);
  border-left: 4px solid transparent;
}

.consultation-item.unread {
  border-left-color: var(--primary-color);
}

.consultation-item.urgent {
  border-left-color: var(--error-color);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.customer-info {
  display: flex;
  align-items: center;
}

.customer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: var(--spacing-sm);
}

.customer-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.time-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.online-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success-color);
}

.offline-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-disabled);
}

.last-message {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.4;
  margin-bottom: var(--spacing-xs);
}

.unread-count {
  background: var(--error-color);
  color: var(--white);
  border-radius: var(--border-radius-xl);
  padding: 2px var(--spacing-xs);
  font-size: var(--font-size-xs);
  min-width: 16px;
  text-align: center;
}
```

### 2.3 客服聊天页面

#### 页面结构
```
┌─────────────────────────────────────┐
│ [←] 张三 [●在线]     [ℹ️] [⋯更多]   │ ← 聊天头部
├─────────────────────────────────────┤
│                                     │
│                ┌─────────────────┐  │ ← 用户消息
│         10:30  │ 我想了解一下产品  │  │
│                │ 的相关信息       │  │
│                └─────────────────┘  │
│                                     │
│  ┌─────────────────┐                │ ← 客服消息
│  │ 好的，请问您想了  │ 10:32 ✓✓      │
│  │ 解哪方面的信息？  │                │
│  └─────────────────┘                │
│                                     │
│                ┌─────────────────┐  │
│         10:33  │ 主要是价格方面    │  │
│                └─────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│ 常用回复：                           │ ← 快捷回复
│ [产品介绍] [价格说明] [联系方式]     │
├─────────────────────────────────────┤
│ [😊] [📷] [🎤] [📍] [📎]    [发送] │ ← 输入工具栏
│ ┌─────────────────────────────────┐ │
│ │ 请输入回复内容...                │ │ ← 输入框
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2.4 客户信息侧边栏

#### 页面结构
```
┌─────────────────────────────────────┐
│              客户信息                │ ← 标题
├─────────────────────────────────────┤
│                                     │
│        ┌─────────────┐              │
│        │   [头像]     │              │ ← 客户头像
│        └─────────────┘              │
│             张三                     │
│                                     │
│ 基本信息                             │
│ ┌─────────────────────────────────┐ │
│ │ 微信昵称：张三                   │ │
│ │ 手机号码：138****8888           │ │ ← 基本信息
│ │ 首次咨询：2024-12-20            │ │
│ │ 咨询次数：3次                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 标签管理                             │
│ ┌─────────────────────────────────┐ │
│ │ [VIP客户] [产品咨询] [+添加]     │ │ ← 客户标签
│ └─────────────────────────────────┘ │
│                                     │
│ 备注信息                             │
│ ┌─────────────────────────────────┐ │
│ │ 对价格比较敏感，需要详细说明...   │ │ ← 备注
│ │                                 │ │
│ │              [编辑备注]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 历史记录                             │
│ ┌─────────────────────────────────┐ │
│ │ 2024-12-18 产品咨询             │ │ ← 历史记录
│ │ 2024-12-15 价格询问             │ │
│ │ 2024-12-10 首次咨询             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## 3. 交互设计规范

### 3.1 页面跳转动画
```css
/* 页面切换动画 */
.page-enter {
  transform: translateX(100%);
}

.page-enter-active {
  transform: translateX(0);
  transition: transform 0.3s ease-out;
}

.page-exit {
  transform: translateX(0);
}

.page-exit-active {
  transform: translateX(-100%);
  transition: transform 0.3s ease-out;
}
```

### 3.2 消息发送动画
```css
/* 消息发送动画 */
.message-send {
  animation: messageSend 0.3s ease-out;
}

@keyframes messageSend {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### 3.3 加载状态
```css
/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 3.4 状态反馈
```css
/* 成功状态 */
.status-success {
  color: var(--success-color);
}

/* 错误状态 */
.status-error {
  color: var(--error-color);
}

/* 警告状态 */
.status-warning {
  color: var(--warning-color);
}

/* 信息状态 */
.status-info {
  color: var(--info-color);
}
```

## 4. 无障碍设计

### 4.1 颜色对比度
- 确保文本与背景的对比度至少为 4.5:1
- 重要信息的对比度至少为 7:1

### 4.2 字体大小
- 最小字体大小不低于 12px
- 重要信息使用 14px 以上字体

### 4.3 触摸目标
- 按钮最小尺寸 44px × 44px
- 相邻可点击元素间距至少 8px

### 4.4 语义化标签
```html
<!-- 使用语义化标签 -->
<header>页面头部</header>
<main>主要内容</main>
<nav>导航菜单</nav>
<section>内容区块</section>
<article>文章内容</article>
<aside>侧边栏</aside>
<footer>页面底部</footer>
```
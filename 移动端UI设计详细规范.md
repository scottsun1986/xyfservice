# 移动端UI设计详细规范

## 1. 小程序端客户界面设计

### 1.1 首页设计

#### 页面结构
```
┌─────────────────────────────────────┐
│ ◀ 返回    客服咨询    [分享] [更多] │ 状态栏
├─────────────────────────────────────┤
│                                     │
│           [公司Logo]                │
│                                     │
│         欢迎使用客服咨询系统         │
│                                     │
│    ┌─────────────────────────────┐  │
│    │                             │  │
│    │         扫码咨询             │  │
│    │                             │  │
│    │      [扫描二维码图标]        │  │
│    │                             │  │
│    │    扫描客服二维码开始咨询     │  │
│    │                             │  │
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │                             │  │
│    │         直接咨询             │  │
│    │                             │  │
│    │      [对话气泡图标]          │  │
│    │                             │  │
│    │      点击开始在线咨询        │  │
│    │                             │  │
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │                             │  │
│    │         历史记录             │  │
│    │                             │  │
│    │      [时钟图标]             │  │
│    │                             │  │
│    │      查看历史咨询记录        │  │
│    │                             │  │
│    └─────────────────────────────┘  │
│                                     │
│                                     │
│     服务时间：09:00 - 18:00         │
│     客服电话：400-123-4567          │
│                                     │
└─────────────────────────────────────┘
```

#### 样式规范
```css
/* 小程序首页样式 */
.homepage {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  padding: 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 40rpx;
  border-radius: 20rpx;
}

.welcome-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20rpx;
}

.welcome-subtitle {
  font-size: 28rpx;
  color: #666666;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  margin-bottom: 80rpx;
}

.action-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;
}

.action-card:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  margin: 0 auto 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 40rpx;
}

.action-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16rpx;
}

.action-desc {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}

.service-info {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
}

.service-time {
  font-size: 26rpx;
  color: #333333;
  margin-bottom: 16rpx;
}

.service-phone {
  font-size: 26rpx;
  color: #1890ff;
  font-weight: 500;
}
```

### 1.2 扫码页面设计

#### 页面结构
```
┌─────────────────────────────────────┐
│ ◀ 返回    扫码咨询              ⚙️ │ 导航栏
├─────────────────────────────────────┤
│                                     │
│                                     │
│    ┌─────────────────────────────┐  │
│    │                             │  │
│    │                             │  │
│    │                             │  │
│    │        扫描框区域            │  │
│    │                             │  │
│    │                             │  │
│    │                             │  │
│    └─────────────────────────────┘  │
│                                     │
│      将二维码放入框内进行扫描        │
│                                     │
│                                     │
│    ┌─────────────────────────────┐  │
│    │         [相册图标]           │  │
│    │       从相册选择二维码        │  │
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │         [手电筒图标]         │  │
│    │         开启/关闭闪光灯       │  │
│    └─────────────────────────────┘  │
│                                     │
│                                     │
│         扫描客服专属二维码           │
│         即可开始一对一咨询           │
│                                     │
└─────────────────────────────────────┘
```

#### 样式规范
```css
/* 扫码页面样式 */
.scan-page {
  min-height: 100vh;
  background: #000000;
  position: relative;
}

.scan-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500rpx;
  height: 500rpx;
}

.scan-frame {
  width: 100%;
  height: 100%;
  border: 4rpx solid #ffffff;
  border-radius: 16rpx;
  position: relative;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, #1890ff, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(500rpx); }
}

.scan-corners {
  position: absolute;
  top: -4rpx;
  left: -4rpx;
  right: -4rpx;
  bottom: -4rpx;
}

.corner {
  position: absolute;
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #1890ff;
}

.corner.top-left {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.corner.top-right {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.corner.bottom-left {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.corner.bottom-right {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

.scan-tip {
  position: absolute;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  color: #ffffff;
  font-size: 28rpx;
  text-align: center;
  line-height: 1.5;
}

.scan-actions {
  position: absolute;
  bottom: 80rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 80rpx;
}

.scan-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  color: #ffffff;
  font-size: 24rpx;
}

.action-btn {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  backdrop-filter: blur(10rpx);
}
```

### 1.3 聊天页面设计

#### 页面结构
```
┌─────────────────────────────────────┐
│ ◀ 返回  李客服 🟢在线    📞 [更多] │ 导航栏
├─────────────────────────────────────┤
│                                     │ 聊天区域
│  ┌─────────────────────────────┐    │
│  │ 您好，我是李客服，很高兴为您  │    │
│  │ 服务！请问有什么可以帮助您的？│    │
│  └─────────────────────────────┘    │
│                            10:30    │
│                                     │
│                    ┌─────────────┐  │
│                    │ 我想了解一下 │  │
│                    │ 你们的产品   │  │
│                    └─────────────┘  │
│                              10:32  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 好的，请问您想了解哪方面的   │    │
│  │ 信息呢？我们有多种产品...    │    │
│  └─────────────────────────────┘    │
│                            10:33    │
│                                     │
│                    ┌─────────────┐  │
│                    │ 主要是价格   │  │
│                    │ 方面的信息   │  │
│                    └─────────────┘  │
│                              10:35  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 正在输入中...               │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│ [+] ┌─────────────────────┐ [发送] │ 输入区域
│     │ 请输入消息内容...    │       │
│     └─────────────────────┘       │
└─────────────────────────────────────┘
```

#### 样式规范
```css
/* 聊天页面样式 */
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  background: #ffffff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.back-btn {
  font-size: 32rpx;
  color: #333333;
}

.staff-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.staff-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}

.staff-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.staff-status {
  font-size: 24rpx;
  color: #52c41a;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  background: #52c41a;
  border-radius: 50%;
}

.header-actions {
  display: flex;
  gap: 30rpx;
}

.action-btn {
  font-size: 32rpx;
  color: #666666;
}

.chat-content {
  flex: 1;
  padding: 30rpx;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.message-item {
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
}

.message-item.sent {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.message-bubble {
  padding: 24rpx 30rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-item.received .message-bubble {
  background: #ffffff;
  color: #333333;
  border-bottom-left-radius: 8rpx;
}

.message-item.sent .message-bubble {
  background: #1890ff;
  color: #ffffff;
  border-bottom-right-radius: 8rpx;
}

.message-time {
  font-size: 22rpx;
  color: #999999;
  text-align: center;
}

.message-item.sent .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
}

.typing-dots {
  display: flex;
  gap: 8rpx;
}

.typing-dot {
  width: 12rpx;
  height: 12rpx;
  background: #cccccc;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-20rpx);
  }
}

.chat-input {
  background: #ffffff;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.input-actions {
  font-size: 36rpx;
  color: #666666;
}

.input-field {
  flex: 1;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 20rpx 30rpx;
  font-size: 28rpx;
  border: none;
  outline: none;
}

.send-btn {
  background: #1890ff;
  color: #ffffff;
  border: none;
  border-radius: 40rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.send-btn:disabled {
  background: #cccccc;
}
```

### 1.4 图片预览页面

#### 页面结构
```
┌─────────────────────────────────────┐
│ ✕ 关闭                    [保存] │ 导航栏
├─────────────────────────────────────┤
│                                     │
│                                     │
│                                     │
│                                     │
│            [图片内容]               │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│        ● ○ ○ ○                     │ 指示器
│                                     │
│  [分享] [保存到相册] [发送给朋友]    │ 操作栏
└─────────────────────────────────────┘
```

#### 样式规范
```css
/* 图片预览样式 */
.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  z-index: 1000;
}

.preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  z-index: 1001;
}

.close-btn {
  color: #ffffff;
  font-size: 32rpx;
}

.save-btn {
  color: #ffffff;
  font-size: 28rpx;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-indicators {
  position: absolute;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16rpx;
}

.indicator {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.indicator.active {
  background: #ffffff;
}

.preview-actions {
  position: absolute;
  bottom: 80rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 60rpx;
}

.preview-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  color: #ffffff;
  font-size: 24rpx;
}

.preview-action-icon {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  backdrop-filter: blur(10rpx);
}
```

## 2. 小程序端客服界面设计

### 2.1 客服登录页面

#### 页面结构
```
┌─────────────────────────────────────┐
│              客服登录               │ 标题栏
├─────────────────────────────────────┤
│                                     │
│           [公司Logo]                │
│                                     │
│         客服管理系统                 │
│                                     │
│    ┌─────────────────────────────┐  │
│    │ 工号                        │  │
│    │ ┌─────────────────────────┐ │  │
│    │ │                         │ │  │
│    │ └─────────────────────────┘ │  │
│    └─────────────────────────────┘  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │ 密码                        │  │
│    │ ┌─────────────────────────┐ │  │
│    │ │ ●●●●●●●●                │ │  │
│    │ └─────────────────────────┘ │  │
│    └─────────────────────────────┘  │
│                                     │
│    □ 记住密码                       │
│                                     │
│    ┌─────────────────────────────┐  │
│    │          登录               │  │
│    └─────────────────────────────┘  │
│                                     │
│           ──── 或 ────              │
│                                     │
│    ┌─────────────────────────────┐  │
│    │        微信授权登录          │  │
│    └─────────────────────────────┘  │
│                                     │
│         忘记密码？联系管理员         │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 客服工作台首页

#### 页面结构
```
┌─────────────────────────────────────┐
│ [头像] 李客服 🟢在线    [设置] [退出]│ 顶部栏
├─────────────────────────────────────┤
│                                     │
│ 今日数据                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ 接待量   │ │ 进行中   │ │ 平均响应 │ │
│ │   23    │ │   5     │ │ 2.5分钟  │ │
│ │ +3      │ │ +1      │ │ -0.3分钟 │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│ 待处理咨询                           │
│ ┌─────────────────────────────────┐ │
│ │ [👤] 张三                        │ │
│ │ 我想了解产品价格...              │ │
│ │ 3分钟前                    [回复]│ │
│ ├─────────────────────────────────┤ │
│ │ [👤] 李四                        │ │
│ │ 有什么优惠活动吗？              │ │
│ │ 5分钟前                    [回复]│ │
│ ├─────────────────────────────────┤ │
│ │ [👤] 王五                        │ │
│ │ 售后服务怎么联系？              │ │
│ │ 8分钟前                    [回复]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ 快捷操作                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ 📊      │ │ 👥      │ │ ⚙️      │ │
│ │ 数据统计 │ │ 客户管理 │ │ 设置中心 │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 2.3 客服聊天页面

#### 页面结构
```
┌─────────────────────────────────────┐
│ ◀ 返回  张三 [VIP]      📋 [转接] │ 导航栏
├─────────────────────────────────────┤
│                                     │ 聊天区域
│                    ┌─────────────┐  │
│                    │ 我想了解一下 │  │
│                    │ 产品的价格   │  │
│                    └─────────────┘  │
│                              10:30  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 您好！我是李客服，很高兴为您  │    │
│  │ 服务。关于产品价格...        │    │
│  └─────────────────────────────┘    │
│                            10:32    │
│                                     │
│                    ┌─────────────┐  │
│                    │ 能详细介绍一 │  │
│                    │ 下吗？       │  │
│                    └─────────────┘  │
│                              10:35  │
│                                     │
├─────────────────────────────────────┤
│ [模板] [+] ┌─────────────┐ [发送] │ 输入区域
│           │ 输入回复...  │       │
│           └─────────────┘       │
└─────────────────────────────────────┘
```

### 2.4 客户信息侧边栏

#### 页面结构
```
┌─────────────────────────────────────┐
│ 客户信息                      ✕ 关闭│ 标题栏
├─────────────────────────────────────┤
│                                     │
│        [客户头像]                   │
│                                     │
│ 姓名：张三                           │
│ 手机：138****8888                   │
│ 标签：[VIP客户] [产品咨询]           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 备注信息                         │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 对价格比较敏感，需要详细说明  │ │ │
│ │ │ 购买意向较强...              │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                          [编辑] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 咨询历史                             │
│ ┌─────────────────────────────────┐ │
│ │ 2024-12-20 产品咨询             │ │
│ │ 客服：李客服 满意度：⭐⭐⭐⭐⭐    │ │
│ ├─────────────────────────────────┤ │
│ │ 2024-12-18 价格询问             │ │
│ │ 客服：王客服 满意度：⭐⭐⭐⭐     │ │
│ ├─────────────────────────────────┤ │
│ │ 2024-12-15 首次咨询             │ │
│ │ 客服：张客服 满意度：⭐⭐⭐⭐     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 操作                                 │
│ ┌─────────────────────────────────┐ │
│ │          转接其他客服            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │          结束当前咨询            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │          添加客户标签            │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## 3. 交互设计规范

### 3.1 页面转场动画

```css
/* 页面转场动画 */
.page-enter {
  transform: translateX(100%);
  opacity: 0;
}

.page-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 0.3s ease;
}

.page-exit {
  transform: translateX(0);
  opacity: 1;
}

.page-exit-active {
  transform: translateX(-100%);
  opacity: 0;
  transition: all 0.3s ease;
}

/* 模态框动画 */
.modal-enter {
  transform: scale(0.8);
  opacity: 0;
}

.modal-enter-active {
  transform: scale(1);
  opacity: 1;
  transition: all 0.3s ease;
}

.modal-exit {
  transform: scale(1);
  opacity: 1;
}

.modal-exit-active {
  transform: scale(0.8);
  opacity: 0;
  transition: all 0.3s ease;
}
```

### 3.2 消息发送动画

```css
/* 消息发送动画 */
.message-send {
  animation: messageSend 0.3s ease;
}

@keyframes messageSend {
  0% {
    transform: translateY(20rpx);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 消息接收动画 */
.message-receive {
  animation: messageReceive 0.3s ease;
}

@keyframes messageReceive {
  0% {
    transform: translateX(-20rpx);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 3.3 加载状态设计

```css
/* 加载动画 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #666666;
}

/* 骨架屏 */
.skeleton {
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### 3.4 状态反馈设计

```css
/* 成功状态 */
.success-feedback {
  background: #f6ffed;
  border: 1rpx solid #b7eb8f;
  color: #52c41a;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

/* 错误状态 */
.error-feedback {
  background: #fff2f0;
  border: 1rpx solid #ffccc7;
  color: #ff4d4f;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

/* 警告状态 */
.warning-feedback {
  background: #fffbe6;
  border: 1rpx solid #ffe58f;
  color: #faad14;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

/* 信息状态 */
.info-feedback {
  background: #e6f7ff;
  border: 1rpx solid #91d5ff;
  color: #1890ff;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}
```

## 4. 无障碍设计

### 4.1 颜色对比度

```css
/* 确保足够的颜色对比度 */
:root {
  --text-primary: #1a1a1a;     /* 对比度 > 7:1 */
  --text-secondary: #666666;   /* 对比度 > 4.5:1 */
  --text-disabled: #999999;    /* 对比度 > 3:1 */
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  :root {
    --text-primary: #000000;
    --text-secondary: #333333;
    --border-color: #000000;
    --background-color: #ffffff;
  }
}
```

### 4.2 字体大小适配

```css
/* 字体大小适配 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 大字体模式 */
.large-font {
  font-size: 1.2em;
}

.large-font .message-bubble {
  font-size: 32rpx;
}

.large-font .input-field {
  font-size: 32rpx;
}
```

### 4.3 触摸目标大小

```css
/* 确保触摸目标至少44rpx */
.touch-target {
  min-width: 88rpx;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button {
  min-height: 88rpx;
  padding: 20rpx 40rpx;
}

.input-field {
  min-height: 88rpx;
  padding: 20rpx 30rpx;
}
```

## 5. 性能优化

### 5.1 图片懒加载

```css
/* 图片懒加载占位符 */
.image-placeholder {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cccccc;
  font-size: 24rpx;
}

.image-loading {
  filter: blur(5rpx);
  transition: filter 0.3s ease;
}

.image-loaded {
  filter: blur(0);
}
```

### 5.2 虚拟滚动

```css
/* 虚拟滚动容器 */
.virtual-scroll {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.virtual-item {
  position: absolute;
  left: 0;
  right: 0;
  transition: transform 0.1s ease;
}

.virtual-placeholder {
  height: 100rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}
```
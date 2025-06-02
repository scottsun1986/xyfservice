# XYF客服系统

一个基于Node.js和微信小程序的智能客服系统，支持实时聊天、工单管理、数据分析等功能。

## 🚀 功能特性

### 核心功能
- **实时聊天**: 基于Socket.IO的实时通信
- **智能分配**: 自动分配客服人员
- **多媒体支持**: 支持文字、图片、文件传输
- **工单管理**: 完整的工单生命周期管理
- **数据统计**: 丰富的数据分析和报表

### 用户端功能
- 微信小程序客户端
- 用户注册/登录
- 发起咨询会话
- 查看历史记录
- 评价反馈
- 消息通知

### 客服端功能
- Web管理后台
- 多会话管理
- 快捷回复
- 文件传输
- 客户信息查看
- 工作统计

### 管理端功能
- 系统配置管理
- 用户权限管理
- 数据统计分析
- 系统监控
- 日志管理

## 🏗️ 技术架构

### 后端技术栈
- **运行环境**: Node.js 18+
- **Web框架**: Express.js
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.0
- **实时通信**: Socket.IO
- **身份认证**: JWT
- **文件存储**: 本地存储/云存储
- **日志**: Winston
- **API文档**: Swagger

### 前端技术栈
- **小程序**: 微信小程序原生开发
- **管理后台**: Vue.js 3 + Element Plus
- **状态管理**: Vuex/Pinia
- **HTTP客户端**: Axios
- **UI组件**: Element Plus

### 基础设施
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **监控**: Prometheus + Grafana
- **日志收集**: ELK Stack (可选)
- **CI/CD**: GitHub Actions (可选)

## 📦 项目结构

```
xyfservice/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数
│   │   └── app.js          # 应用入口
│   ├── config/             # 配置文件
│   ├── tests/              # 测试文件
│   ├── Dockerfile          # Docker构建文件
│   └── package.json        # 依赖配置
├── frontend/               # 前端项目
│   ├── miniprogram/        # 微信小程序
│   └── admin/              # 管理后台
├── database/               # 数据库相关
│   ├── init/               # 初始化脚本
│   └── my.cnf              # MySQL配置
├── nginx/                  # Nginx配置
│   ├── nginx.conf          # 主配置
│   └── conf.d/             # 站点配置
├── redis/                  # Redis配置
├── monitoring/             # 监控配置
│   ├── prometheus.yml      # Prometheus配置
│   └── grafana/            # Grafana配置
├── logs/                   # 日志目录
├── uploads/                # 上传文件目录
├── docker-compose.yml      # Docker编排文件
├── .env.example            # 环境变量示例
├── deploy.sh               # 部署脚本
├── DEPLOYMENT.md           # 部署文档
└── README.md               # 项目说明
```

## 🚀 快速开始

### 环境要求
- Docker 20.10+
- Docker Compose 1.29+
- Git 2.0+

### 1. 克隆项目
```bash
git clone <repository-url>
cd xyfservice
```

### 2. 配置环境
```bash
# 复制环境变量文件
cp .env.example .env

# 编辑环境变量（重要！）
nano .env
```

### 3. 启动服务
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 启动所有服务
./deploy.sh start

# 或启动包含监控的服务
./deploy.sh start monitoring
```

### 4. 验证部署
```bash
# 检查服务状态
./deploy.sh status

# 检查健康状态
./deploy.sh health
```

### 5. 访问服务
- **API服务**: http://localhost:3000
- **健康检查**: http://localhost/health
- **API文档**: http://localhost:3000/api-docs
- **Grafana监控**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090

## 📖 详细文档

- [部署文档](DEPLOYMENT.md) - 详细的部署指南
- [API文档](http://localhost:3000/api-docs) - 接口文档
- [UI组件库设计](UI组件库设计.md) - 前端组件设计

## 🔧 开发指南

### 本地开发环境

#### 后端开发
```bash
cd backend
npm install
npm run dev
```

#### 前端开发
```bash
# 管理后台
cd frontend/admin
npm install
npm run serve

# 微信小程序
# 使用微信开发者工具打开 frontend/miniprogram 目录
```

### 代码规范

#### JavaScript/Node.js
- 使用 ESLint + Prettier
- 遵循 Airbnb 代码规范
- 使用 JSDoc 注释

#### 数据库
- 使用驼峰命名法
- 添加适当的索引
- 编写数据库迁移脚本

#### API设计
- 遵循 RESTful 规范
- 使用统一的响应格式
- 添加适当的错误处理

### 测试

```bash
# 运行单元测试
npm test

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage
```

## 🔐 安全配置

### 生产环境安全检查清单

- [ ] 修改所有默认密码
- [ ] 配置SSL/TLS证书
- [ ] 启用防火墙
- [ ] 配置安全头
- [ ] 限制数据库访问
- [ ] 启用日志监控
- [ ] 配置备份策略
- [ ] 更新系统补丁

### 环境变量安全

```bash
# 设置环境文件权限
chmod 600 .env

# 使用强密码
# 数据库密码至少16位，包含大小写字母、数字、特殊字符
# JWT密钥至少32位随机字符串
```

## 📊 监控和运维

### 服务监控
- **Prometheus**: 指标收集
- **Grafana**: 可视化面板
- **健康检查**: 自动服务检测
- **日志聚合**: 集中日志管理

### 关键指标
- API响应时间
- 数据库连接数
- 内存使用率
- CPU使用率
- 磁盘空间
- 网络流量

### 告警配置
```yaml
# prometheus/rules/alerts.yml
groups:
  - name: xyfservice
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage > 80
        for: 5m
        annotations:
          summary: "CPU使用率过高"
      
      - alert: DatabaseDown
        expr: mysql_up == 0
        for: 1m
        annotations:
          summary: "数据库服务异常"
```

## 🔄 备份和恢复

### 自动备份
```bash
# 添加到crontab
0 2 * * * cd /path/to/xyfservice && ./deploy.sh backup
```

### 手动备份
```bash
# 备份数据库
./deploy.sh backup

# 备份文件
tar -czf backup_$(date +%Y%m%d).tar.gz uploads/ logs/
```

### 恢复数据
```bash
# 恢复数据库
./deploy.sh restore backup_20231201_020000.sql

# 恢复文件
tar -xzf backup_20231201.tar.gz
```

## 🚀 性能优化

### 数据库优化
- 添加适当索引
- 优化查询语句
- 配置连接池
- 启用查询缓存

### 应用优化
- 启用Redis缓存
- 使用CDN加速
- 压缩静态资源
- 启用Gzip压缩

### 系统优化
- 调整内核参数
- 优化文件描述符限制
- 配置负载均衡
- 使用容器编排

## 🐛 故障排除

### 常见问题

#### 服务启动失败
```bash
# 查看日志
docker-compose logs backend

# 检查端口占用
netstat -tlnp | grep :3000

# 检查磁盘空间
df -h
```

#### 数据库连接失败
```bash
# 检查MySQL状态
docker-compose ps mysql

# 测试连接
docker-compose exec mysql mysql -u root -p
```

#### 性能问题
```bash
# 查看资源使用
docker stats

# 分析慢查询
grep "slow query" logs/mysql.log
```

## 📝 更新日志

### v1.0.0 (2023-12-01)
- 初始版本发布
- 基础聊天功能
- 用户管理系统
- Docker部署支持

### 计划功能
- [ ] 智能客服机器人
- [ ] 多语言支持
- [ ] 移动端APP
- [ ] 高级数据分析
- [ ] 第三方集成

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码贡献规范
- 遵循现有代码风格
- 添加适当的测试
- 更新相关文档
- 确保CI/CD通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **项目维护者**: [Your Name]
- **邮箱**: your.email@example.com
- **问题反馈**: [GitHub Issues](https://github.com/yourname/xyfservice/issues)
- **技术支持**: [技术支持文档](SUPPORT.md)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

**注意**: 在生产环境部署前，请务必阅读 [部署文档](DEPLOYMENT.md) 并完成所有安全配置。
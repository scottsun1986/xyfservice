# XYF客服系统 Docker部署文档

## 目录
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [环境配置](#环境配置)
- [服务管理](#服务管理)
- [监控配置](#监控配置)
- [备份与恢复](#备份与恢复)
- [故障排除](#故障排除)
- [性能优化](#性能优化)
- [安全配置](#安全配置)

## 系统要求

### 硬件要求
- **CPU**: 最低2核，推荐4核以上
- **内存**: 最低4GB，推荐8GB以上
- **存储**: 最低20GB可用空间，推荐50GB以上
- **网络**: 稳定的网络连接

### 软件要求
- **操作系统**: Linux (Ubuntu 18.04+, CentOS 7+) 或 macOS
- **Docker**: 20.10.0+
- **Docker Compose**: 1.29.0+
- **Git**: 2.0+

### 端口要求
确保以下端口可用：
- `80`: Nginx HTTP
- `443`: Nginx HTTPS (可选)
- `3000`: 后端API服务
- `3001`: Grafana监控面板
- `3306`: MySQL数据库
- `6379`: Redis缓存
- `9090`: Prometheus监控

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd xyfservice
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑环境变量
nano .env
```

### 3. 启动服务
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 启动基础服务
./deploy.sh start

# 或启动包含监控的完整服务
./deploy.sh start monitoring
```

### 4. 验证部署
```bash
# 检查服务状态
./deploy.sh status

# 检查健康状态
./deploy.sh health
```

## 详细部署步骤

### 步骤1: 环境准备

#### 安装Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 安装Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 步骤2: 项目配置

#### 创建目录结构
```bash
mkdir -p logs uploads/{images,files,avatars} database/backups
chmod 755 uploads logs
```

#### 配置SSL证书（可选）
```bash
# 创建SSL证书目录
mkdir -p ssl

# 使用Let's Encrypt获取证书
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*
```

### 步骤3: 环境变量配置

编辑 `.env` 文件，配置以下关键参数：

```bash
# 服务器配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 数据库配置
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=xyfservice
MYSQL_USER=xyfservice
MYSQL_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=your_root_password

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# CORS配置
CORS_ORIGIN=https://yourdomain.com

# 监控配置
GRAFANA_ADMIN_PASSWORD=admin123

# SSL配置（如果启用HTTPS）
SSL_CERT_PATH=./ssl/fullchain.pem
SSL_KEY_PATH=./ssl/privkey.pem
```

### 步骤4: 启动服务

#### 基础服务启动
```bash
./deploy.sh start
```

#### 包含监控的完整服务启动
```bash
./deploy.sh start monitoring
```

#### 手动启动（不使用脚本）
```bash
# 启动基础服务
docker-compose up -d

# 启动包含监控的服务
docker-compose --profile monitoring up -d
```

## 环境配置

### 开发环境
```bash
# 复制开发环境配置
cp .env.example .env.dev

# 修改开发环境特定配置
echo "NODE_ENV=development" >> .env.dev
echo "LOG_LEVEL=debug" >> .env.dev

# 使用开发环境配置启动
docker-compose --env-file .env.dev up -d
```

### 测试环境
```bash
# 复制测试环境配置
cp .env.example .env.test

# 修改测试环境特定配置
echo "NODE_ENV=test" >> .env.test
echo "MYSQL_DATABASE=xyfservice_test" >> .env.test

# 使用测试环境配置启动
docker-compose --env-file .env.test up -d
```

### 生产环境
```bash
# 复制生产环境配置
cp .env.example .env.prod

# 修改生产环境特定配置
echo "NODE_ENV=production" >> .env.prod
echo "LOG_LEVEL=info" >> .env.prod

# 使用生产环境配置启动
docker-compose --env-file .env.prod up -d
```

## 服务管理

### 基本操作

```bash
# 查看服务状态
./deploy.sh status
docker-compose ps

# 启动服务
./deploy.sh start

# 停止服务
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 查看日志
./deploy.sh logs
./deploy.sh logs backend  # 查看特定服务日志

# 进入容器
docker-compose exec backend bash
docker-compose exec mysql mysql -u root -p
```

### 服务扩容

```bash
# 扩展后端服务实例
docker-compose up -d --scale backend=3

# 扩展Redis实例（主从模式）
docker-compose up -d --scale redis=2
```

### 滚动更新

```bash
# 更新单个服务
docker-compose up -d --no-deps backend

# 更新所有服务
./deploy.sh update
```

## 监控配置

### Grafana配置

1. 访问 Grafana: `http://localhost:3001`
2. 默认登录: `admin/admin123`
3. 导入预配置的仪表板

### Prometheus配置

1. 访问 Prometheus: `http://localhost:9090`
2. 查看监控目标状态
3. 配置告警规则

### 自定义监控指标

在后端应用中添加自定义指标：

```javascript
// 在 app.js 中添加
const prometheus = require('prom-client');

// 创建自定义指标
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

// 暴露指标端点
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

## 备份与恢复

### 数据库备份

```bash
# 自动备份
./deploy.sh backup

# 手动备份
docker-compose exec mysql mysqldump -u root -p xyfservice > backup_$(date +%Y%m%d_%H%M%S).sql

# 定时备份（添加到crontab）
0 2 * * * cd /path/to/xyfservice && ./deploy.sh backup
```

### 数据库恢复

```bash
# 恢复数据库
./deploy.sh restore backup_20231201_020000.sql

# 手动恢复
docker-compose exec -T mysql mysql -u root -p xyfservice < backup_20231201_020000.sql
```

### 文件备份

```bash
# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/

# 备份日志文件
tar -czf logs_backup_$(date +%Y%m%d_%H%M%S).tar.gz logs/

# 完整系统备份
tar -czf system_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  .
```

## 故障排除

### 常见问题

#### 1. 服务启动失败

```bash
# 查看详细日志
docker-compose logs backend

# 检查端口占用
netstat -tlnp | grep :3000

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

#### 2. 数据库连接失败

```bash
# 检查MySQL服务状态
docker-compose ps mysql

# 测试数据库连接
docker-compose exec backend node -e "console.log('Testing DB connection...')"

# 查看MySQL日志
docker-compose logs mysql
```

#### 3. Redis连接失败

```bash
# 检查Redis服务状态
docker-compose ps redis

# 测试Redis连接
docker-compose exec redis redis-cli ping

# 查看Redis日志
docker-compose logs redis
```

#### 4. 文件上传失败

```bash
# 检查上传目录权限
ls -la uploads/

# 修复权限
chmod 755 uploads/
chown -R 1000:1000 uploads/

# 检查磁盘空间
df -h
```

### 性能问题诊断

```bash
# 查看容器资源使用
docker stats

# 查看系统负载
top
htop

# 查看网络连接
netstat -an | grep :3000

# 查看磁盘IO
iotop
```

### 日志分析

```bash
# 查看错误日志
grep -i error logs/*.log

# 查看访问日志
tail -f logs/access.log

# 分析慢查询
grep "slow query" logs/mysql.log

# 查看内存使用
grep "out of memory" logs/*.log
```

## 性能优化

### 数据库优化

#### MySQL配置优化

编辑 `database/my.cnf`：

```ini
# 连接配置
max_connections = 200
max_connect_errors = 10000

# 缓存配置
innodb_buffer_pool_size = 1G
query_cache_size = 256M
query_cache_type = 1

# 日志配置
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

#### 索引优化

```sql
-- 添加常用查询索引
CREATE INDEX idx_consultations_user_status ON consultations(user_id, status);
CREATE INDEX idx_messages_consultation_time ON messages(consultation_id, created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### Redis优化

编辑 `redis/redis.conf`：

```conf
# 内存优化
maxmemory 512mb
maxmemory-policy allkeys-lru

# 持久化优化
save 900 1
save 300 10
save 60 10000

# 网络优化
tcp-keepalive 300
timeout 0
```

### 应用优化

#### Node.js性能优化

```javascript
// 启用集群模式
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // 启动应用
  require('./app.js');
}

// 启用压缩
const compression = require('compression');
app.use(compression());

// 启用缓存
const redis = require('redis');
const client = redis.createClient();

app.use('/api', (req, res, next) => {
  const key = req.originalUrl;
  client.get(key, (err, result) => {
    if (result) {
      res.json(JSON.parse(result));
    } else {
      next();
    }
  });
});
```

### Nginx优化

编辑 `nginx/nginx.conf`：

```nginx
# 工作进程优化
worker_processes auto;
worker_connections 1024;

# 缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# Gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# 静态文件缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 安全配置

### 网络安全

#### 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3306/tcp
sudo ufw deny 6379/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### SSL/TLS配置

编辑 `nginx/conf.d/default.conf`：

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
}
```

### 应用安全

#### 环境变量安全

```bash
# 设置文件权限
chmod 600 .env
chown root:root .env

# 使用Docker secrets（生产环境推荐）
docker secret create mysql_password mysql_password.txt
docker secret create jwt_secret jwt_secret.txt
```

#### 数据库安全

```sql
-- 创建专用数据库用户
CREATE USER 'xyfservice'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON xyfservice.* TO 'xyfservice'@'%';
FLUSH PRIVILEGES;

-- 删除默认用户
DROP USER ''@'localhost';
DROP USER ''@'%';
```

### 监控安全

#### 日志监控

```bash
# 安装fail2ban
sudo apt install fail2ban

# 配置fail2ban
sudo cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
EOF

sudo systemctl restart fail2ban
```

#### 入侵检测

```bash
# 安装AIDE
sudo apt install aide
sudo aideinit
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# 定期检查
echo "0 3 * * * /usr/bin/aide --check" | sudo crontab -
```

## 维护计划

### 日常维护

```bash
#!/bin/bash
# daily_maintenance.sh

# 检查服务状态
./deploy.sh health

# 清理日志
find logs/ -name "*.log" -mtime +30 -delete

# 清理临时文件
docker system prune -f

# 备份数据库
./deploy.sh backup

# 检查磁盘空间
df -h | awk '$5 > 80 {print $0}' | mail -s "Disk Space Alert" admin@example.com
```

### 周期性维护

```bash
#!/bin/bash
# weekly_maintenance.sh

# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新Docker镜像
docker-compose pull

# 重启服务
./deploy.sh restart

# 数据库优化
docker-compose exec mysql mysqlcheck -u root -p --optimize --all-databases

# 生成性能报告
./deploy.sh status > weekly_report_$(date +%Y%m%d).txt
```

---

## 联系支持

如果在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的 GitHub Issues
3. 联系技术支持团队

**注意**: 在生产环境部署前，请务必在测试环境中验证所有配置和功能。
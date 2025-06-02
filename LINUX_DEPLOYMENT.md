# XYF客服系统 Linux服务器一键部署指南

本文档提供在Linux服务器上一键部署XYF客服系统的详细步骤。

## 🖥️ 服务器要求

### 系统要求
- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **CPU**: 最低2核，推荐4核以上
- **内存**: 最低4GB，推荐8GB以上
- **存储**: 最低20GB可用空间，推荐50GB以上
- **网络**: 公网IP地址（用于域名绑定）

### 端口要求
确保以下端口在防火墙中开放：
- `22`: SSH访问
- `80`: HTTP服务
- `443`: HTTPS服务（可选）

## 🚀 一键部署脚本

### 方式一：使用自动安装脚本

```bash
# 下载并执行一键安装脚本
curl -fsSL https://raw.githubusercontent.com/yourname/xyfservice/main/install.sh | bash
```

### 方式二：手动部署步骤

#### 1. 连接服务器
```bash
# 使用SSH连接到服务器
ssh root@your-server-ip

# 或使用密钥连接
ssh -i your-key.pem root@your-server-ip
```

#### 2. 系统环境准备

##### Ubuntu/Debian系统
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git unzip

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用Docker组权限
exit
ssh root@your-server-ip
```

##### CentOS/RHEL系统
```bash
# 更新系统包
sudo yum update -y

# 安装必要工具
sudo yum install -y curl wget git unzip

# 安装Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用Docker组权限
exit
ssh root@your-server-ip
```

#### 3. 下载项目代码
```bash
# 创建项目目录
sudo mkdir -p /opt/xyfservice
cd /opt/xyfservice

# 克隆项目（替换为实际的仓库地址）
sudo git clone https://github.com/yourname/xyfservice.git .

# 设置目录权限
sudo chown -R $USER:$USER /opt/xyfservice
```

#### 4. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**重要配置项**：
```bash
# 服务器配置
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# 数据库配置（使用强密码）
MYSQL_ROOT_PASSWORD=your_very_secure_root_password_here
MYSQL_PASSWORD=your_very_secure_password_here
MYSQL_USER=xyfservice
MYSQL_DATABASE=xyfservice

# Redis配置
REDIS_PASSWORD=your_very_secure_redis_password_here

# JWT配置（生成32位随机字符串）
JWT_SECRET=your_32_character_jwt_secret_key_here

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 域名配置
CORS_ORIGIN=https://yourdomain.com

# SSL配置（如果使用HTTPS）
SSL_CERT_PATH=./ssl/fullchain.pem
SSL_KEY_PATH=./ssl/privkey.pem
```

#### 5. 配置SSL证书（可选但推荐）

##### 使用Let's Encrypt免费证书
```bash
# 安装Certbot
sudo apt install certbot  # Ubuntu/Debian
# 或
sudo yum install certbot  # CentOS/RHEL

# 获取SSL证书（替换yourdomain.com为实际域名）
sudo certbot certonly --standalone -d yourdomain.com

# 创建SSL目录并复制证书
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*

# 设置证书自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

#### 6. 配置防火墙

##### Ubuntu/Debian (UFW)
```bash
# 启用防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow 22/tcp

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看防火墙状态
sudo ufw status
```

##### CentOS/RHEL (firewalld)
```bash
# 启动防火墙服务
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许HTTP和HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# 重载防火墙配置
sudo firewall-cmd --reload

# 查看防火墙状态
sudo firewall-cmd --list-all
```

#### 7. 一键启动服务
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 启动所有服务
./deploy.sh start

# 或启动包含监控的完整服务
./deploy.sh start monitoring
```

#### 8. 验证部署
```bash
# 检查服务状态
./deploy.sh status

# 检查健康状态
./deploy.sh health

# 查看服务日志
./deploy.sh logs
```

## 🌐 域名配置

### 1. DNS解析配置
在域名服务商处添加以下DNS记录：

```
类型    名称    值
A      @       your-server-ip
A      www     your-server-ip
```

### 2. Nginx配置更新
如果使用自定义域名，需要更新Nginx配置：

```bash
# 编辑Nginx配置
nano nginx/conf.d/default.conf

# 修改server_name
server_name yourdomain.com www.yourdomain.com;

# 重启Nginx服务
docker-compose restart nginx
```

## 📊 服务访问地址

部署完成后，可以通过以下地址访问服务：

- **API服务**: http://yourdomain.com 或 http://your-server-ip
- **健康检查**: http://yourdomain.com/health
- **API文档**: http://yourdomain.com:3000/api-docs
- **Grafana监控**: http://yourdomain.com:3001 (admin/admin123)
- **Prometheus**: http://yourdomain.com:9090

## 🔧 常用运维命令

### 服务管理
```bash
# 查看服务状态
./deploy.sh status

# 重启服务
./deploy.sh restart

# 停止服务
./deploy.sh stop

# 查看日志
./deploy.sh logs
./deploy.sh logs backend  # 查看特定服务日志

# 更新服务
./deploy.sh update
```

### 数据库管理
```bash
# 备份数据库
./deploy.sh backup

# 恢复数据库
./deploy.sh restore backup_20231201_020000.sql

# 进入数据库
docker-compose exec mysql mysql -u root -p
```

### 系统监控
```bash
# 查看系统资源使用
top
htop
df -h
free -h

# 查看Docker容器状态
docker ps
docker stats

# 查看服务日志
docker-compose logs -f
```

## 🛡️ 安全加固

### 1. 系统安全
```bash
# 禁用root密码登录，仅允许密钥登录
sudo nano /etc/ssh/sshd_config
# 设置以下配置：
# PasswordAuthentication no
# PermitRootLogin prohibit-password

# 重启SSH服务
sudo systemctl restart sshd

# 安装fail2ban防止暴力破解
sudo apt install fail2ban  # Ubuntu/Debian
sudo yum install epel-release && sudo yum install fail2ban  # CentOS

# 启动fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 2. 应用安全
```bash
# 设置环境文件权限
chmod 600 .env

# 定期更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
sudo yum update -y  # CentOS

# 定期更新Docker镜像
docker-compose pull
./deploy.sh restart
```

## 📈 性能优化

### 1. 系统优化
```bash
# 优化文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. 应用优化
```bash
# 启用Nginx缓存
# 编辑nginx/nginx.conf，取消缓存配置的注释

# 配置数据库连接池
# 编辑.env文件，调整数据库连接参数
DB_CONNECTION_LIMIT=20
DB_ACQUIRE_TIMEOUT=60000
```

## 🔄 自动化部署

### 创建自动部署脚本
```bash
# 创建自动部署脚本
cat > auto_deploy.sh << 'EOF'
#!/bin/bash

# 自动部署脚本
set -e

echo "开始自动部署..."

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
./deploy.sh restart

# 检查服务状态
sleep 30
./deploy.sh health

echo "部署完成！"
EOF

chmod +x auto_deploy.sh
```

### 设置定时任务
```bash
# 添加定时备份任务
crontab -e

# 添加以下内容：
# 每天凌晨2点备份数据库
0 2 * * * cd /opt/xyfservice && ./deploy.sh backup

# 每周日凌晨3点更新系统
0 3 * * 0 apt update && apt upgrade -y

# 每月1号凌晨4点清理Docker
0 4 1 * * docker system prune -f
```

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 服务启动失败
```bash
# 查看详细错误日志
docker-compose logs backend

# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

#### 2. 数据库连接失败
```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 查看MySQL日志
docker-compose logs mysql

# 测试数据库连接
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

#### 3. 域名无法访问
```bash
# 检查DNS解析
nslookup yourdomain.com

# 检查防火墙状态
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS

# 检查Nginx配置
nginx -t
docker-compose exec nginx nginx -t
```

#### 4. SSL证书问题
```bash
# 检查证书有效期
openssl x509 -in ssl/fullchain.pem -text -noout | grep "Not After"

# 手动续期证书
sudo certbot renew

# 重新复制证书
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

## 📞 技术支持

如果在部署过程中遇到问题：

1. 查看本文档的故障排除部分
2. 检查项目的GitHub Issues
3. 查看系统日志：`journalctl -xe`
4. 联系技术支持团队

## 📝 部署检查清单

部署完成后，请确认以下项目：

- [ ] 服务器环境准备完成
- [ ] Docker和Docker Compose安装成功
- [ ] 项目代码下载完成
- [ ] 环境变量配置正确
- [ ] SSL证书配置完成（如需要）
- [ ] 防火墙规则配置正确
- [ ] 所有服务启动成功
- [ ] 健康检查通过
- [ ] 域名解析配置正确
- [ ] 监控系统正常运行
- [ ] 备份策略配置完成
- [ ] 安全加固措施实施

---

**注意**: 在生产环境部署前，请务必在测试环境中验证所有配置和功能。确保所有密码都使用强密码，并定期更新系统和应用。
#!/bin/bash

# XYF客服系统一键安装脚本
# 适用于 Ubuntu 18.04+, CentOS 7+, Debian 9+
# 使用方法: curl -fsSL https://raw.githubusercontent.com/yourname/xyfservice/main/install.sh | bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="xyfservice"
INSTALL_DIR="/opt/${PROJECT_NAME}"
GIT_REPO="https://github.com/yourname/xyfservice.git"
DOCKER_COMPOSE_VERSION="2.20.0"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示欢迎信息
show_welcome() {
    clear
    echo -e "${CYAN}"
    echo "================================================"
    echo "    XYF客服系统 一键安装脚本"
    echo "================================================"
    echo -e "${NC}"
    echo "本脚本将自动安装以下组件："
    echo "  • Docker & Docker Compose"
    echo "  • XYF客服系统"
    echo "  • MySQL数据库"
    echo "  • Redis缓存"
    echo "  • Nginx反向代理"
    echo "  • Prometheus + Grafana监控"
    echo ""
    echo "系统要求："
    echo "  • Ubuntu 18.04+ / CentOS 7+ / Debian 9+"
    echo "  • 最低4GB内存，推荐8GB+"
    echo "  • 最低20GB磁盘空间"
    echo ""
    read -p "是否继续安装? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "安装已取消"
        exit 0
    fi
}

# 检测操作系统
detect_os() {
    log_step "检测操作系统..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        OS=$DISTRIB_ID
        VER=$DISTRIB_RELEASE
    elif [ -f /etc/debian_version ]; then
        OS=Debian
        VER=$(cat /etc/debian_version)
    elif [ -f /etc/SuSe-release ]; then
        OS=openSUSE
    elif [ -f /etc/redhat-release ]; then
        OS=RedHat
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    
    log_info "检测到操作系统: $OS $VER"
    
    # 设置包管理器
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        PKG_MANAGER="apt"
        PKG_UPDATE="apt update"
        PKG_INSTALL="apt install -y"
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        PKG_MANAGER="yum"
        PKG_UPDATE="yum update -y"
        PKG_INSTALL="yum install -y"
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
    
    log_success "操作系统检测完成"
}

# 检查系统要求
check_requirements() {
    log_step "检查系统要求..."
    
    # 检查内存
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEMORY_GB" -lt 3 ]; then
        log_warning "内存不足4GB，可能影响系统性能"
    else
        log_success "内存检查通过: ${MEMORY_GB}GB"
    fi
    
    # 检查磁盘空间
    DISK_GB=$(df / | awk 'NR==2{print int($4/1024/1024)}')
    if [ "$DISK_GB" -lt 15 ]; then
        log_error "磁盘空间不足20GB，当前可用: ${DISK_GB}GB"
        exit 1
    else
        log_success "磁盘空间检查通过: ${DISK_GB}GB可用"
    fi
    
    # 检查网络连接
    if ! ping -c 1 google.com &> /dev/null; then
        log_warning "网络连接检查失败，请确保网络正常"
    else
        log_success "网络连接检查通过"
    fi
}

# 更新系统
update_system() {
    log_step "更新系统包..."
    
    if ! sudo $PKG_UPDATE; then
        log_error "系统更新失败"
        exit 1
    fi
    
    log_success "系统更新完成"
}

# 安装基础工具
install_basic_tools() {
    log_step "安装基础工具..."
    
    local tools="curl wget git unzip vim htop"
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        tools="$tools software-properties-common apt-transport-https ca-certificates gnupg lsb-release"
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        tools="$tools yum-utils device-mapper-persistent-data lvm2"
    fi
    
    if ! sudo $PKG_INSTALL $tools; then
        log_error "基础工具安装失败"
        exit 1
    fi
    
    log_success "基础工具安装完成"
}

# 安装Docker
install_docker() {
    log_step "安装Docker..."
    
    # 检查Docker是否已安装
    if command -v docker &> /dev/null; then
        log_info "Docker已安装，版本: $(docker --version)"
        return 0
    fi
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        # Ubuntu/Debian安装Docker
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt update
        sudo $PKG_INSTALL docker-ce docker-ce-cli containerd.io
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        # CentOS/RHEL安装Docker
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo $PKG_INSTALL docker-ce docker-ce-cli containerd.io
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    # 添加用户到docker组
    sudo usermod -aG docker $USER
    
    log_success "Docker安装完成"
}

# 安装Docker Compose
install_docker_compose() {
    log_step "安装Docker Compose..."
    
    # 检查Docker Compose是否已安装
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose已安装，版本: $(docker-compose --version)"
        return 0
    fi
    
    # 下载并安装Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose安装完成"
}

# 配置防火墙
configure_firewall() {
    log_step "配置防火墙..."
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        # Ubuntu/Debian使用UFW
        if command -v ufw &> /dev/null; then
            sudo ufw --force enable
            sudo ufw allow 22/tcp
            sudo ufw allow 80/tcp
            sudo ufw allow 443/tcp
            log_success "UFW防火墙配置完成"
        fi
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        # CentOS/RHEL使用firewalld
        if command -v firewall-cmd &> /dev/null; then
            sudo systemctl start firewalld
            sudo systemctl enable firewalld
            sudo firewall-cmd --permanent --add-service=http
            sudo firewall-cmd --permanent --add-service=https
            sudo firewall-cmd --permanent --add-service=ssh
            sudo firewall-cmd --reload
            log_success "firewalld防火墙配置完成"
        fi
    fi
}

# 下载项目代码
download_project() {
    log_step "下载项目代码..."
    
    # 创建安装目录
    sudo mkdir -p $INSTALL_DIR
    
    # 克隆项目
    if [ -d "$INSTALL_DIR/.git" ]; then
        log_info "项目已存在，更新代码..."
        cd $INSTALL_DIR
        sudo git pull
    else
        log_info "克隆项目代码..."
        sudo git clone $GIT_REPO $INSTALL_DIR
    fi
    
    # 设置目录权限
    sudo chown -R $USER:$USER $INSTALL_DIR
    cd $INSTALL_DIR
    
    log_success "项目代码下载完成"
}

# 配置环境变量
configure_environment() {
    log_step "配置环境变量..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_info "已创建环境配置文件"
    fi
    
    # 生成随机密码和密钥
    MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # 更新环境变量
    sed -i "s/MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD/" .env
    sed -i "s/MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$MYSQL_PASSWORD/" .env
    sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/NODE_ENV=.*/NODE_ENV=production/" .env
    
    log_success "环境变量配置完成"
    
    # 显示重要信息
    echo -e "${YELLOW}重要信息（请保存）：${NC}"
    echo "MySQL Root密码: $MYSQL_ROOT_PASSWORD"
    echo "MySQL用户密码: $MYSQL_PASSWORD"
    echo "Redis密码: $REDIS_PASSWORD"
    echo "JWT密钥: $JWT_SECRET"
    echo ""
}

# 创建必要目录
create_directories() {
    log_step "创建必要目录..."
    
    mkdir -p logs
    mkdir -p uploads/{images,files,avatars}
    mkdir -p database/backups
    mkdir -p ssl
    
    # 设置权限
    chmod 755 uploads logs
    chmod 700 ssl
    
    log_success "目录创建完成"
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    # 给部署脚本执行权限
    chmod +x deploy.sh
    
    # 启动服务
    ./deploy.sh start
    
    log_success "服务启动完成"
}

# 验证安装
verify_installation() {
    log_step "验证安装..."
    
    # 等待服务启动
    sleep 30
    
    # 检查服务状态
    if ./deploy.sh health; then
        log_success "所有服务运行正常"
    else
        log_error "部分服务异常，请检查日志"
        ./deploy.sh logs
        return 1
    fi
    
    # 获取服务器IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
    
    echo -e "${GREEN}"
    echo "================================================"
    echo "          安装完成！"
    echo "================================================"
    echo -e "${NC}"
    echo "服务访问地址："
    echo "  • API服务: http://$SERVER_IP"
    echo "  • 健康检查: http://$SERVER_IP/health"
    echo "  • API文档: http://$SERVER_IP:3000/api-docs"
    echo "  • Grafana监控: http://$SERVER_IP:3001 (admin/admin123)"
    echo "  • Prometheus: http://$SERVER_IP:9090"
    echo ""
    echo "常用命令："
    echo "  • 查看状态: cd $INSTALL_DIR && ./deploy.sh status"
    echo "  • 查看日志: cd $INSTALL_DIR && ./deploy.sh logs"
    echo "  • 重启服务: cd $INSTALL_DIR && ./deploy.sh restart"
    echo "  • 备份数据: cd $INSTALL_DIR && ./deploy.sh backup"
    echo ""
    echo "配置文件位置: $INSTALL_DIR/.env"
    echo "项目目录: $INSTALL_DIR"
    echo ""
    echo -e "${YELLOW}注意：请保存好上面显示的数据库密码等重要信息！${NC}"
}

# 安装SSL证书（可选）
install_ssl() {
    echo ""
    read -p "是否安装SSL证书？需要域名指向本服务器 (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入域名（如：example.com）: " DOMAIN
        
        if [ -n "$DOMAIN" ]; then
            log_step "安装SSL证书..."
            
            # 安装Certbot
            if [[ "$PKG_MANAGER" == "apt" ]]; then
                sudo $PKG_INSTALL certbot
            elif [[ "$PKG_MANAGER" == "yum" ]]; then
                sudo $PKG_INSTALL epel-release
                sudo $PKG_INSTALL certbot
            fi
            
            # 获取证书
            if sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN; then
                # 复制证书
                sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
                sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
                sudo chown $USER:$USER ssl/*
                
                # 更新Nginx配置
                sed -i "s/server_name _;/server_name $DOMAIN;/" nginx/conf.d/default.conf
                
                # 设置自动续期
                echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
                
                # 重启Nginx
                docker-compose restart nginx
                
                log_success "SSL证书安装完成"
                echo "HTTPS访问地址: https://$DOMAIN"
            else
                log_error "SSL证书安装失败，请检查域名解析"
            fi
        fi
    fi
}

# 主安装流程
main() {
    # 检查是否为root用户
    if [ "$EUID" -eq 0 ]; then
        log_error "请不要使用root用户运行此脚本"
        exit 1
    fi
    
    # 检查sudo权限
    if ! sudo -n true 2>/dev/null; then
        log_error "需要sudo权限，请确保当前用户有sudo权限"
        exit 1
    fi
    
    show_welcome
    detect_os
    check_requirements
    update_system
    install_basic_tools
    install_docker
    install_docker_compose
    configure_firewall
    download_project
    configure_environment
    create_directories
    start_services
    verify_installation
    install_ssl
    
    log_success "XYF客服系统安装完成！"
}

# 错误处理
trap 'log_error "安装过程中发生错误，请检查日志"' ERR

# 执行主函数
main "$@"
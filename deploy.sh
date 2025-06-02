#!/bin/bash

# XYF客服系统部署脚本
# 使用方法: ./deploy.sh [操作] [参数]
# 操作: start|stop|restart|logs|status|update|backup|restore|cleanup|health
# 参数: monitoring (可选，用于启动监控服务)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 检查环境文件
check_env_file() {
    local env_file=".env"
    
    if [ ! -f "$env_file" ]; then
        log_warning "环境文件 $env_file 不存在，从示例文件复制..."
        cp .env.example $env_file
        log_warning "请编辑 $env_file 文件，配置正确的环境变量"
        read -p "是否现在编辑环境文件? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} $env_file
        fi
    fi
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p logs
    mkdir -p uploads/{images,files,avatars}
    mkdir -p database/backups
    mkdir -p monitoring/grafana/{dashboards,datasources}
    
    # 设置权限
    chmod 755 uploads
    chmod 755 logs
    
    log_success "目录创建完成"
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    
    docker-compose build --no-cache
    
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    local profile="$1"
    
    log_info "启动服务..."
    
    if [ "$profile" = "monitoring" ]; then
        docker-compose --profile monitoring up -d
    else
        docker-compose up -d
    fi
    
    log_success "服务启动完成"
    
    # 等待服务就绪
    log_info "等待服务就绪..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    docker-compose down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    local profile="$1"
    
    log_info "重启服务..."
    
    stop_services
    sleep 5
    start_services "$profile"
    
    log_success "服务重启完成"
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    local services=("mysql" "redis" "backend" "nginx")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if docker-compose ps | grep "$service" | grep -q "Up (healthy)\|Up"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务异常"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "所有服务运行正常"
        
        # 显示访问信息
        echo
        log_info "服务访问信息:"
        echo "  API服务: http://localhost:3000"
        echo "  健康检查: http://localhost/health"
        echo "  Grafana监控: http://localhost:3001 (admin/admin123)"
        echo "  Prometheus: http://localhost:9090"
    else
        log_error "以下服务异常: ${failed_services[*]}"
        log_info "请使用 './deploy.sh logs' 查看详细日志"
        return 1
    fi
}

# 查看日志
show_logs() {
    local service="$1"
    
    if [ -n "$service" ]; then
        log_info "查看 $service 服务日志..."
        docker-compose logs -f "$service"
    else
        log_info "查看所有服务日志..."
        docker-compose logs -f
    fi
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker-compose ps
    
    echo
    log_info "资源使用情况:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# 更新服务
update_services() {
    log_info "更新服务..."
    
    # 拉取最新代码
    if [ -d ".git" ]; then
        log_info "拉取最新代码..."
        git pull
    fi
    
    # 重新构建镜像
    build_images
    
    # 重启服务
    restart_services
    
    log_success "服务更新完成"
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."
    
    local backup_file="database/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose exec mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD:-root123456}" xyfservice > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_success "数据库备份完成: $backup_file"
    else
        log_error "数据库备份失败"
        return 1
    fi
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    log_info "恢复数据库: $backup_file"
    
    docker-compose exec -T mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD:-root123456}" xyfservice < "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_success "数据库恢复完成"
    else
        log_error "数据库恢复失败"
        return 1
    fi
}

# 清理系统
cleanup() {
    log_info "清理系统..."
    
    # 停止服务
    docker-compose down
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    # 清理未使用的网络
    docker network prune -f
    
    log_success "系统清理完成"
}

# 显示帮助信息
show_help() {
    echo "XYF客服系统部署脚本"
    echo
    echo "使用方法:"
    echo "  $0 [操作] [参数]"
    echo
    echo "操作:"
    echo "  start [monitoring]    启动服务 (可选启用监控)"
    echo "  stop                  停止服务"
    echo "  restart [monitoring]  重启服务"
    echo "  status                显示服务状态"
    echo "  logs [服务名]         查看日志"
    echo "  update                更新服务"
    echo "  build                 构建镜像"
    echo "  backup                备份数据库"
    echo "  restore <文件>        恢复数据库"
    echo "  cleanup               清理系统"
    echo "  health                检查服务健康状态"
    echo "  help                  显示帮助信息"
    echo
    echo "示例:"
    echo "  $0 start             # 启动基础服务"
    echo "  $0 start monitoring  # 启动包含监控的服务"
    echo "  $0 logs backend      # 查看后端服务日志"
    echo "  $0 backup            # 备份数据库"
}

# 主函数
main() {
    local operation="$1"
    local param="$2"
    
    case "$operation" in
        "start")
            check_dependencies
            check_env_file
            create_directories
            start_services "$param"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            check_dependencies
            restart_services "$param"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$param"
            ;;
        "update")
            check_dependencies
            update_services
            ;;
        "build")
            check_dependencies
            build_images
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            if [ -z "$param" ]; then
                log_error "请指定备份文件"
                exit 1
            fi
            restore_database "$param"
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            check_services_health
            ;;
        "help"|"")
            show_help
            ;;
        *)
            log_error "未知操作: $operation"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
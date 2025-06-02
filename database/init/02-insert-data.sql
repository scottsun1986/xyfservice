-- 插入初始数据
USE xyfservice;

-- 插入默认管理员账户
INSERT INTO admins (id, username, password, name, email, role, permissions, is_active, created_at) VALUES 
('admin-001', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin@example.com', 'super_admin', 
 JSON_ARRAY('user_management', 'staff_management', 'system_config', 'data_export', 'log_view'), TRUE, NOW());

-- 插入默认客服账户
INSERT INTO staff (id, username, password, name, email, department, position, status, max_concurrent_users, is_active, created_at) VALUES 
('staff-001', 'service01', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '客服小王', 'service01@example.com', '客服部', '客服专员', 'offline', 10, TRUE, NOW()),
('staff-002', 'service02', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '客服小李', 'service02@example.com', '客服部', '客服专员', 'offline', 10, TRUE, NOW()),
('staff-003', 'service03', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '客服小张', 'service03@example.com', '客服部', '高级客服', 'offline', 15, TRUE, NOW());

-- 插入系统配置
INSERT INTO system_configs (id, key_name, value, description, type, is_public, created_at) VALUES 
(UUID(), 'system_name', 'XYF客服系统', '系统名称', 'string', TRUE, NOW()),
(UUID(), 'system_version', '1.0.0', '系统版本', 'string', TRUE, NOW()),
(UUID(), 'max_upload_size', '10485760', '最大上传文件大小(字节)', 'number', FALSE, NOW()),
(UUID(), 'allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx","xls","xlsx"]', '允许上传的文件类型', 'json', FALSE, NOW()),
(UUID(), 'consultation_timeout', '1800', '咨询超时时间(秒)', 'number', FALSE, NOW()),
(UUID(), 'max_message_length', '2000', '消息最大长度', 'number', FALSE, NOW()),
(UUID(), 'auto_assign_staff', 'true', '是否自动分配客服', 'boolean', FALSE, NOW()),
(UUID(), 'working_hours_start', '09:00', '工作时间开始', 'string', TRUE, NOW()),
(UUID(), 'working_hours_end', '18:00', '工作时间结束', 'string', TRUE, NOW()),
(UUID(), 'welcome_message', '您好，欢迎使用XYF客服系统！我们将竭诚为您服务。', '欢迎消息', 'string', TRUE, NOW()),
(UUID(), 'offline_message', '抱歉，当前客服不在线，请留言或稍后再试。', '离线消息', 'string', TRUE, NOW()),
(UUID(), 'maintenance_mode', 'false', '维护模式', 'boolean', TRUE, NOW()),
(UUID(), 'rate_limit_api', '100', 'API请求频率限制(每分钟)', 'number', FALSE, NOW()),
(UUID(), 'rate_limit_upload', '10', '上传请求频率限制(每分钟)', 'number', FALSE, NOW()),
(UUID(), 'session_timeout', '7200', '会话超时时间(秒)', 'number', FALSE, NOW());

-- 插入示例通知
INSERT INTO notifications (id, type, title, content, status, created_at) VALUES 
(UUID(), 'system', '系统上线通知', 'XYF客服系统已成功部署并上线运行！', 'unread', NOW()),
(UUID(), 'announcement', '服务时间调整', '客服服务时间调整为每日9:00-18:00，感谢您的理解。', 'unread', NOW());

-- 创建索引优化
-- 为高频查询创建复合索引
CREATE INDEX idx_consultations_user_status ON consultations(user_id, status, created_at);
CREATE INDEX idx_messages_consultation_time ON messages(consultation_id, created_at);
CREATE INDEX idx_notifications_recipient_status ON notifications(user_id, status, created_at);
CREATE INDEX idx_operation_logs_operator_time ON operation_logs(operator_id, operator_type, created_at);

-- 创建全文索引（如果需要搜索功能）
-- ALTER TABLE messages ADD FULLTEXT(content);
-- ALTER TABLE consultations ADD FULLTEXT(title, description);

-- 创建视图
-- 在线客服视图
CREATE VIEW v_online_staff AS
SELECT 
    id,
    name,
    avatar,
    department,
    position,
    status,
    current_users,
    max_concurrent_users,
    rating,
    (max_concurrent_users - current_users) AS available_slots
FROM staff 
WHERE is_active = TRUE AND status IN ('online', 'busy')
ORDER BY available_slots DESC, rating DESC;

-- 咨询统计视图
CREATE VIEW v_consultation_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_consultations,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_consultations,
    COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_consultations,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_consultations,
    AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating
FROM consultations 
WHERE deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 客服工作统计视图
CREATE VIEW v_staff_stats AS
SELECT 
    s.id,
    s.name,
    s.department,
    COUNT(c.id) as total_consultations,
    COUNT(CASE WHEN c.status = 'closed' THEN 1 END) as closed_consultations,
    AVG(CASE WHEN c.rating IS NOT NULL THEN c.rating END) as avg_rating,
    COUNT(CASE WHEN DATE(c.created_at) = CURDATE() THEN 1 END) as today_consultations
FROM staff s
LEFT JOIN consultations c ON s.id = c.staff_id AND c.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.name, s.department
ORDER BY total_consultations DESC;

-- 创建存储过程
DELIMITER //

-- 自动分配客服存储过程
CREATE PROCEDURE AssignStaffToConsultation(
    IN consultation_id VARCHAR(36),
    OUT assigned_staff_id VARCHAR(36)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE staff_id VARCHAR(36);
    DECLARE available_slots INT;
    
    -- 查找可用客服（按可用槽位数和评分排序）
    DECLARE staff_cursor CURSOR FOR 
        SELECT id, (max_concurrent_users - current_users) as slots
        FROM staff 
        WHERE is_active = TRUE 
          AND status = 'online' 
          AND current_users < max_concurrent_users
        ORDER BY slots DESC, rating DESC
        LIMIT 1;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN staff_cursor;
    
    read_loop: LOOP
        FETCH staff_cursor INTO staff_id, available_slots;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 尝试分配客服
        UPDATE consultations 
        SET staff_id = staff_id, 
            status = 'in_progress',
            started_at = NOW(),
            updated_at = NOW()
        WHERE id = consultation_id AND staff_id IS NULL;
        
        -- 如果分配成功，更新客服当前用户数
        IF ROW_COUNT() > 0 THEN
            UPDATE staff 
            SET current_users = current_users + 1,
                updated_at = NOW()
            WHERE id = staff_id;
            
            SET assigned_staff_id = staff_id;
            LEAVE read_loop;
        END IF;
    END LOOP;
    
    CLOSE staff_cursor;
END//

-- 清理过期数据存储过程
CREATE PROCEDURE CleanupExpiredData()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 清理30天前的登录尝试记录
    DELETE FROM login_attempts 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- 清理90天前的操作日志
    DELETE FROM operation_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- 清理已删除的数据（软删除超过30天）
    DELETE FROM users 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    DELETE FROM consultations 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    DELETE FROM messages 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    COMMIT;
END//

DELIMITER ;

-- 创建定时任务（需要开启事件调度器）
-- SET GLOBAL event_scheduler = ON;

-- 每天凌晨2点清理过期数据
-- CREATE EVENT IF NOT EXISTS cleanup_expired_data
-- ON SCHEDULE EVERY 1 DAY
-- STARTS '2024-01-01 02:00:00'
-- DO
--   CALL CleanupExpiredData();

-- 插入操作日志
INSERT INTO operation_logs (id, operator_type, action, details, ip_address, result, created_at) VALUES 
(UUID(), 'system', 'database_init', JSON_OBJECT('message', '数据库初始化完成'), '127.0.0.1', 'success', NOW());
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const config = require('../../config/config')
const logger = require('../utils/logger')
const { validateFileUpload } = require('../validators/uploadValidator')

const router = express.Router()

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const today = new Date()
    const dateDir = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
    const fullPath = path.join(uploadDir, dateDir)
    
    // 确保日期目录存在
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
    }
    
    cb(null, fullPath)
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const hash = crypto.createHash('md5').update(file.originalname + uniqueSuffix).digest('hex').substring(0, 8)
    cb(null, `${hash}_${uniqueSuffix}${ext}`)
  }
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    audio: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'text/plain']
  }
  
  const allAllowedTypes = Object.values(allowedTypes).flat()
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false)
  }
}

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 从配置文件读取
    files: 5 // 最多5个文件
  }
})

/**
 * 上传单个文件
 * POST /api/upload/single
 */
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      })
    }

    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${path.relative(uploadDir, req.file.path).replace(/\\/g, '/')}`
    }

    // 记录上传日志
    logger.info('文件上传成功:', {
      userId: req.user?.userId,
      filename: fileInfo.filename,
      originalName: fileInfo.originalName,
      size: fileInfo.size
    })

    res.json({
      success: true,
      message: '文件上传成功',
      data: fileInfo
    })

  } catch (error) {
    logger.error('文件上传错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '文件上传失败'
    })
  }
})

/**
 * 上传多个文件
 * POST /api/upload/multiple
 */
router.post('/multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      })
    }

    const filesInfo = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${path.relative(uploadDir, file.path).replace(/\\/g, '/')}`
    }))

    // 记录上传日志
    logger.info('多文件上传成功:', {
      userId: req.user?.userId,
      count: filesInfo.length,
      files: filesInfo.map(f => ({ filename: f.filename, size: f.size }))
    })

    res.json({
      success: true,
      message: '文件上传成功',
      data: filesInfo
    })

  } catch (error) {
    logger.error('多文件上传错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '文件上传失败'
    })
  }
})

/**
 * 上传头像
 * POST /api/upload/avatar
 */
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传头像文件'
      })
    }

    // 检查是否为图片
    if (!req.file.mimetype.startsWith('image/')) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path)
      return res.status(400).json({
        success: false,
        message: '头像必须是图片文件'
      })
    }

    const avatarInfo = {
      filename: req.file.filename,
      url: `/uploads/${path.relative(uploadDir, req.file.path).replace(/\\/g, '/')}`
    }

    logger.info('头像上传成功:', {
      userId: req.user?.userId,
      filename: avatarInfo.filename
    })

    res.json({
      success: true,
      message: '头像上传成功',
      data: avatarInfo
    })

  } catch (error) {
    logger.error('头像上传错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '头像上传失败'
    })
  }
})

/**
 * 删除文件
 * DELETE /api/upload/:filename
 */
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    
    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      })
    }

    // 查找文件
    const filePath = await findFileByName(filename)
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      })
    }

    // 删除文件
    fs.unlinkSync(filePath)

    logger.info('文件删除成功:', {
      userId: req.user?.userId,
      filename: filename
    })

    res.json({
      success: true,
      message: '文件删除成功'
    })

  } catch (error) {
    logger.error('文件删除错误:', error)
    res.status(500).json({
      success: false,
      message: '文件删除失败'
    })
  }
})

/**
 * 获取文件信息
 * GET /api/upload/info/:filename
 */
router.get('/info/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    
    // 安全检查
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      })
    }

    const filePath = await findFileByName(filename)
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      })
    }

    const stats = fs.statSync(filePath)
    const fileInfo = {
      filename: filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${path.relative(uploadDir, filePath).replace(/\\/g, '/')}`
    }

    res.json({
      success: true,
      data: fileInfo
    })

  } catch (error) {
    logger.error('获取文件信息错误:', error)
    res.status(500).json({
      success: false,
      message: '获取文件信息失败'
    })
  }
})

/**
 * 获取上传配置
 * GET /api/upload/config
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      maxFileSize: config.upload.maxFileSize,
      allowedTypes: {
        image: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        video: ['mp4', 'avi', 'mov', 'wmv'],
        audio: ['mp3', 'wav', 'aac', 'ogg'],
        document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']
      },
      maxFiles: 5
    }
  })
})

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = '文件上传错误'
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `文件大小超过限制 (${config.upload.maxFileSize / 1024 / 1024}MB)`
        break
      case 'LIMIT_FILE_COUNT':
        message = '文件数量超过限制'
        break
      case 'LIMIT_UNEXPECTED_FILE':
        message = '意外的文件字段'
        break
      default:
        message = error.message
    }
    
    return res.status(400).json({
      success: false,
      message: message
    })
  }
  
  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
  
  logger.error('上传中间件错误:', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
})

// 辅助函数：根据文件名查找文件
async function findFileByName(filename) {
  const searchDir = (dir) => {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        const found = searchDir(fullPath)
        if (found) return found
      } else if (item === filename) {
        return fullPath
      }
    }
    
    return null
  }
  
  return searchDir(uploadDir)
}

module.exports = router
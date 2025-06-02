const Joi = require('joi')

/**
 * 文件上传验证
 */
const validateFileUpload = (data) => {
  const schema = Joi.object({
    file: Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string().required(),
      size: Joi.number().positive().max(50 * 1024 * 1024).required() // 最大50MB
        .messages({
          'number.max': '文件大小不能超过50MB'
        }),
      destination: Joi.string().required(),
      filename: Joi.string().required(),
      path: Joi.string().required()
    }).required()
      .messages({
        'any.required': '文件信息不能为空'
      })
  })
  
  return schema.validate(data)
}

/**
 * 多文件上传验证
 */
const validateMultipleFileUpload = (data) => {
  const schema = Joi.object({
    files: Joi.array().items(
      Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string().required(),
        size: Joi.number().positive().max(50 * 1024 * 1024).required(),
        destination: Joi.string().required(),
        filename: Joi.string().required(),
        path: Joi.string().required()
      })
    ).min(1).max(5).required()
      .messages({
        'array.min': '至少需要上传一个文件',
        'array.max': '最多只能上传5个文件',
        'any.required': '文件列表不能为空'
      })
  })
  
  return schema.validate(data)
}

/**
 * 头像上传验证
 */
const validateAvatarUpload = (data) => {
  const schema = Joi.object({
    file: Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string().pattern(/^image\/(jpeg|jpg|png|gif|webp)$/).required()
        .messages({
          'string.pattern.base': '头像必须是图片文件 (jpeg, jpg, png, gif, webp)'
        }),
      size: Joi.number().positive().max(5 * 1024 * 1024).required() // 最大5MB
        .messages({
          'number.max': '头像文件大小不能超过5MB'
        }),
      destination: Joi.string().required(),
      filename: Joi.string().required(),
      path: Joi.string().required()
    }).required()
      .messages({
        'any.required': '头像文件不能为空'
      })
  })
  
  return schema.validate(data)
}

/**
 * 文件名验证
 */
const validateFilename = (filename) => {
  const schema = Joi.string()
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.pattern.base': '文件名只能包含字母、数字、点、下划线和连字符',
      'string.min': '文件名不能为空',
      'string.max': '文件名不能超过255个字符',
      'any.required': '文件名不能为空'
    })
  
  return schema.validate(filename)
}

/**
 * 文件类型验证
 */
const validateFileType = (mimetype, allowedTypes = []) => {
  if (allowedTypes.length === 0) {
    // 默认允许的文件类型
    allowedTypes = [
      // 图片
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // 文档
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      // 音频
      'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg',
      // 视频
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv'
    ]
  }
  
  const schema = Joi.string().valid(...allowedTypes).required()
    .messages({
      'any.only': `不支持的文件类型: ${mimetype}`,
      'any.required': '文件类型不能为空'
    })
  
  return schema.validate(mimetype)
}

/**
 * 文件大小验证
 */
const validateFileSize = (size, maxSize = 50 * 1024 * 1024) => {
  const schema = Joi.number().positive().max(maxSize).required()
    .messages({
      'number.base': '文件大小必须是数字',
      'number.positive': '文件大小必须大于0',
      'number.max': `文件大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`,
      'any.required': '文件大小不能为空'
    })
  
  return schema.validate(size)
}

/**
 * 图片尺寸验证
 */
const validateImageDimensions = (width, height, maxWidth = 4096, maxHeight = 4096) => {
  const schema = Joi.object({
    width: Joi.number().integer().positive().max(maxWidth).required()
      .messages({
        'number.base': '图片宽度必须是数字',
        'number.integer': '图片宽度必须是整数',
        'number.positive': '图片宽度必须大于0',
        'number.max': `图片宽度不能超过${maxWidth}像素`,
        'any.required': '图片宽度不能为空'
      }),
    height: Joi.number().integer().positive().max(maxHeight).required()
      .messages({
        'number.base': '图片高度必须是数字',
        'number.integer': '图片高度必须是整数',
        'number.positive': '图片高度必须大于0',
        'number.max': `图片高度不能超过${maxHeight}像素`,
        'any.required': '图片高度不能为空'
      })
  })
  
  return schema.validate({ width, height })
}

/**
 * 音频/视频时长验证
 */
const validateMediaDuration = (duration, maxDuration = 3600) => {
  const schema = Joi.number().positive().max(maxDuration).required()
    .messages({
      'number.base': '媒体时长必须是数字',
      'number.positive': '媒体时长必须大于0',
      'number.max': `媒体时长不能超过${maxDuration}秒`,
      'any.required': '媒体时长不能为空'
    })
  
  return schema.validate(duration)
}

/**
 * 上传配置验证
 */
const validateUploadConfig = (config) => {
  const schema = Joi.object({
    maxFileSize: Joi.number().positive().max(100 * 1024 * 1024).default(50 * 1024 * 1024)
      .messages({
        'number.base': '最大文件大小必须是数字',
        'number.positive': '最大文件大小必须大于0',
        'number.max': '最大文件大小不能超过100MB'
      }),
    
    maxFiles: Joi.number().integer().positive().max(10).default(5)
      .messages({
        'number.base': '最大文件数量必须是数字',
        'number.integer': '最大文件数量必须是整数',
        'number.positive': '最大文件数量必须大于0',
        'number.max': '最大文件数量不能超过10'
      }),
    
    allowedTypes: Joi.array().items(Joi.string()).min(1).optional()
      .messages({
        'array.base': '允许的文件类型必须是数组',
        'array.min': '至少需要指定一种允许的文件类型'
      }),
    
    uploadPath: Joi.string().optional()
      .messages({
        'string.base': '上传路径必须是字符串'
      })
  })
  
  return schema.validate(config)
}

/**
 * 文件删除验证
 */
const validateFileDelete = (filename) => {
  const schema = Joi.string()
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.pattern.base': '文件名格式不正确',
      'string.min': '文件名不能为空',
      'string.max': '文件名不能超过255个字符',
      'any.required': '文件名不能为空'
    })
  
  return schema.validate(filename)
}

/**
 * 批量文件删除验证
 */
const validateBatchFileDelete = (filenames) => {
  const schema = Joi.array().items(
    Joi.string().pattern(/^[a-zA-Z0-9._-]+$/).min(1).max(255)
  ).min(1).max(10).required()
    .messages({
      'array.base': '文件名列表必须是数组',
      'array.min': '至少需要指定一个文件',
      'array.max': '最多只能删除10个文件',
      'any.required': '文件名列表不能为空'
    })
  
  return schema.validate(filenames)
}

/**
 * 文件URL验证
 */
const validateFileUrl = (url) => {
  const schema = Joi.string().uri().required()
    .messages({
      'string.base': '文件URL必须是字符串',
      'string.uri': '文件URL格式不正确',
      'any.required': '文件URL不能为空'
    })
  
  return schema.validate(url)
}

module.exports = {
  validateFileUpload,
  validateMultipleFileUpload,
  validateAvatarUpload,
  validateFilename,
  validateFileType,
  validateFileSize,
  validateImageDimensions,
  validateMediaDuration,
  validateUploadConfig,
  validateFileDelete,
  validateBatchFileDelete,
  validateFileUrl
}
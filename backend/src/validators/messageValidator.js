const Joi = require('joi')

/**
 * 发送消息验证
 */
const validateMessageSend = (data) => {
  const schema = Joi.object({
    consultationId: Joi.number().integer().positive().required()
      .messages({
        'number.base': '咨询ID必须是数字',
        'number.integer': '咨询ID必须是整数',
        'number.positive': '咨询ID必须是正数',
        'any.required': '咨询ID不能为空'
      }),
    
    messageType: Joi.string().valid('text', 'image', 'file', 'audio', 'video', 'location', 'system').required()
      .messages({
        'string.base': '消息类型必须是字符串',
        'any.only': '消息类型必须是: text, image, file, audio, video, location, system 之一',
        'any.required': '消息类型不能为空'
      }),
    
    content: Joi.string().max(5000).required()
      .messages({
        'string.base': '消息内容必须是字符串',
        'string.max': '消息内容不能超过5000个字符',
        'any.required': '消息内容不能为空'
      }),
    
    extra: Joi.object().optional()
      .messages({
        'object.base': '扩展信息必须是对象'
      })
  })
  
  return schema.validate(data)
}

/**
 * 消息搜索验证
 */
const validateMessageSearch = (data) => {
  const schema = Joi.object({
    keyword: Joi.string().min(1).max(100).required()
      .messages({
        'string.base': '搜索关键词必须是字符串',
        'string.min': '搜索关键词不能为空',
        'string.max': '搜索关键词不能超过100个字符',
        'any.required': '搜索关键词不能为空'
      }),
    
    consultationId: Joi.number().integer().positive().optional()
      .messages({
        'number.base': '咨询ID必须是数字',
        'number.integer': '咨询ID必须是整数',
        'number.positive': '咨询ID必须是正数'
      }),
    
    messageType: Joi.string().valid('text', 'image', 'file', 'audio', 'video', 'location', 'system').optional()
      .messages({
        'string.base': '消息类型必须是字符串',
        'any.only': '消息类型必须是: text, image, file, audio, video, location, system 之一'
      }),
    
    startDate: Joi.date().iso().optional()
      .messages({
        'date.base': '开始日期必须是有效日期',
        'date.format': '开始日期格式必须是ISO 8601格式'
      }),
    
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
      .messages({
        'date.base': '结束日期必须是有效日期',
        'date.format': '结束日期格式必须是ISO 8601格式',
        'date.min': '结束日期不能早于开始日期'
      }),
    
    page: Joi.number().integer().min(1).default(1)
      .messages({
        'number.base': '页码必须是数字',
        'number.integer': '页码必须是整数',
        'number.min': '页码必须大于0'
      }),
    
    limit: Joi.number().integer().min(1).max(100).default(20)
      .messages({
        'number.base': '每页数量必须是数字',
        'number.integer': '每页数量必须是整数',
        'number.min': '每页数量必须大于0',
        'number.max': '每页数量不能超过100'
      })
  })
  
  return schema.validate(data)
}

/**
 * 标记消息已读验证
 */
const validateMarkRead = (data) => {
  const schema = Joi.object({
    consultationId: Joi.number().integer().positive().required()
      .messages({
        'number.base': '咨询ID必须是数字',
        'number.integer': '咨询ID必须是整数',
        'number.positive': '咨询ID必须是正数',
        'any.required': '咨询ID不能为空'
      }),
    
    messageIds: Joi.array().items(
      Joi.number().integer().positive()
    ).optional()
      .messages({
        'array.base': '消息ID列表必须是数组',
        'number.base': '消息ID必须是数字',
        'number.integer': '消息ID必须是整数',
        'number.positive': '消息ID必须是正数'
      })
  })
  
  return schema.validate(data)
}

/**
 * 消息ID验证
 */
const validateMessageId = (id) => {
  const schema = Joi.number().integer().positive().required()
    .messages({
      'number.base': '消息ID必须是数字',
      'number.integer': '消息ID必须是整数',
      'number.positive': '消息ID必须是正数',
      'any.required': '消息ID不能为空'
    })
  
  return schema.validate(id)
}

/**
 * 消息内容验证（根据类型）
 */
const validateMessageContent = (messageType, content, extra = {}) => {
  let schema
  
  switch (messageType) {
    case 'text':
      schema = Joi.object({
        content: Joi.string().min(1).max(5000).required()
          .messages({
            'string.base': '文本内容必须是字符串',
            'string.min': '文本内容不能为空',
            'string.max': '文本内容不能超过5000个字符',
            'any.required': '文本内容不能为空'
          }),
        extra: Joi.object().optional()
      })
      break
      
    case 'image':
      schema = Joi.object({
        content: Joi.string().uri().required()
          .messages({
            'string.base': '图片URL必须是字符串',
            'string.uri': '图片URL格式不正确',
            'any.required': '图片URL不能为空'
          }),
        extra: Joi.object({
          width: Joi.number().integer().positive().optional(),
          height: Joi.number().integer().positive().optional(),
          size: Joi.number().positive().optional(),
          format: Joi.string().valid('jpg', 'jpeg', 'png', 'gif', 'webp').optional()
        }).optional()
      })
      break
      
    case 'file':
      schema = Joi.object({
        content: Joi.string().uri().required()
          .messages({
            'string.base': '文件URL必须是字符串',
            'string.uri': '文件URL格式不正确',
            'any.required': '文件URL不能为空'
          }),
        extra: Joi.object({
          filename: Joi.string().required(),
          size: Joi.number().positive().optional(),
          mimetype: Joi.string().optional()
        }).required()
      })
      break
      
    case 'audio':
      schema = Joi.object({
        content: Joi.string().uri().required()
          .messages({
            'string.base': '音频URL必须是字符串',
            'string.uri': '音频URL格式不正确',
            'any.required': '音频URL不能为空'
          }),
        extra: Joi.object({
          duration: Joi.number().positive().optional(),
          size: Joi.number().positive().optional(),
          format: Joi.string().valid('mp3', 'wav', 'aac', 'ogg').optional()
        }).optional()
      })
      break
      
    case 'video':
      schema = Joi.object({
        content: Joi.string().uri().required()
          .messages({
            'string.base': '视频URL必须是字符串',
            'string.uri': '视频URL格式不正确',
            'any.required': '视频URL不能为空'
          }),
        extra: Joi.object({
          duration: Joi.number().positive().optional(),
          width: Joi.number().integer().positive().optional(),
          height: Joi.number().integer().positive().optional(),
          size: Joi.number().positive().optional(),
          format: Joi.string().valid('mp4', 'avi', 'mov', 'wmv').optional()
        }).optional()
      })
      break
      
    case 'location':
      schema = Joi.object({
        content: Joi.string().required()
          .messages({
            'string.base': '位置描述必须是字符串',
            'any.required': '位置描述不能为空'
          }),
        extra: Joi.object({
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
          address: Joi.string().optional(),
          accuracy: Joi.number().positive().optional()
        }).required()
      })
      break
      
    case 'system':
      schema = Joi.object({
        content: Joi.string().required()
          .messages({
            'string.base': '系统消息内容必须是字符串',
            'any.required': '系统消息内容不能为空'
          }),
        extra: Joi.object({
          type: Joi.string().valid('notification', 'warning', 'info', 'success').optional(),
          action: Joi.string().optional(),
          data: Joi.object().optional()
        }).optional()
      })
      break
      
    default:
      return {
        error: {
          details: [{ message: '不支持的消息类型' }]
        }
      }
  }
  
  return schema.validate({ content, extra })
}

/**
 * 批量消息验证
 */
const validateBatchMessages = (messages) => {
  const schema = Joi.array().items(
    Joi.object({
      consultationId: Joi.number().integer().positive().required(),
      messageType: Joi.string().valid('text', 'image', 'file', 'audio', 'video', 'location', 'system').required(),
      content: Joi.string().max(5000).required(),
      extra: Joi.object().optional()
    })
  ).min(1).max(10)
    .messages({
      'array.base': '消息列表必须是数组',
      'array.min': '至少需要一条消息',
      'array.max': '最多只能发送10条消息'
    })
  
  return schema.validate(messages)
}

module.exports = {
  validateMessageSend,
  validateMessageSearch,
  validateMarkRead,
  validateMessageId,
  validateMessageContent,
  validateBatchMessages
}
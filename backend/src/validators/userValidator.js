const Joi = require('joi')

/**
 * 用户注册验证
 */
const validateUserRegister = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.base': '用户名必须是字符串',
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少需要3个字符',
        'string.max': '用户名不能超过30个字符',
        'any.required': '用户名不能为空'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': '邮箱必须是字符串',
        'string.email': '邮箱格式不正确',
        'any.required': '邮箱不能为空'
      }),
    
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
      .required()
      .messages({
        'string.base': '密码必须是字符串',
        'string.min': '密码至少需要6个字符',
        'string.max': '密码不能超过128个字符',
        'string.pattern.base': '密码必须包含至少一个大写字母、一个小写字母和一个数字',
        'any.required': '密码不能为空'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': '确认密码与密码不匹配',
        'any.required': '确认密码不能为空'
      }),
    
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .optional()
      .messages({
        'string.base': '手机号必须是字符串',
        'string.pattern.base': '手机号格式不正确'
      }),
    
    nickname: Joi.string()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.base': '昵称必须是字符串',
        'string.min': '昵称至少需要1个字符',
        'string.max': '昵称不能超过50个字符'
      }),
    
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional()
      .messages({
        'any.only': '性别只能是 male、female 或 other'
      }),
    
    birthDate: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.base': '出生日期必须是有效日期',
        'date.max': '出生日期不能是未来日期'
      }),
    
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.base': '头像必须是字符串',
        'string.uri': '头像必须是有效的URL'
      })
  })
  
  return schema.validate(data)
}

/**
 * 用户登录验证
 */
const validateUserLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'string.base': '用户名必须是字符串',
        'any.required': '用户名不能为空'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.base': '密码必须是字符串',
        'any.required': '密码不能为空'
      }),
    
    rememberMe: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': '记住我必须是布尔值'
      })
  })
  
  return schema.validate(data)
}

/**
 * 用户资料更新验证
 */
const validateUserProfileUpdate = (data) => {
  const schema = Joi.object({
    nickname: Joi.string()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.base': '昵称必须是字符串',
        'string.min': '昵称至少需要1个字符',
        'string.max': '昵称不能超过50个字符'
      }),
    
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.base': '邮箱必须是字符串',
        'string.email': '邮箱格式不正确'
      }),
    
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .optional()
      .messages({
        'string.base': '手机号必须是字符串',
        'string.pattern.base': '手机号格式不正确'
      }),
    
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional()
      .messages({
        'any.only': '性别只能是 male、female 或 other'
      }),
    
    birthDate: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.base': '出生日期必须是有效日期',
        'date.max': '出生日期不能是未来日期'
      }),
    
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.base': '头像必须是字符串',
        'string.uri': '头像必须是有效的URL'
      }),
    
    bio: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.base': '个人简介必须是字符串',
        'string.max': '个人简介不能超过500个字符'
      }),
    
    location: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.base': '所在地必须是字符串',
        'string.max': '所在地不能超过100个字符'
      }),
    
    website: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.base': '个人网站必须是字符串',
        'string.uri': '个人网站必须是有效的URL'
      })
  })
  
  return schema.validate(data)
}

/**
 * 密码修改验证
 */
const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.base': '当前密码必须是字符串',
        'any.required': '当前密码不能为空'
      }),
    
    newPassword: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
      .required()
      .messages({
        'string.base': '新密码必须是字符串',
        'string.min': '新密码至少需要6个字符',
        'string.max': '新密码不能超过128个字符',
        'string.pattern.base': '新密码必须包含至少一个大写字母、一个小写字母和一个数字',
        'any.required': '新密码不能为空'
      }),
    
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': '确认新密码与新密码不匹配',
        'any.required': '确认新密码不能为空'
      })
  })
  
  return schema.validate(data)
}

/**
 * 邮箱验证码验证
 */
const validateEmailVerification = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': '邮箱必须是字符串',
        'string.email': '邮箱格式不正确',
        'any.required': '邮箱不能为空'
      }),
    
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.base': '验证码必须是字符串',
        'string.length': '验证码必须是6位数字',
        'string.pattern.base': '验证码必须是6位数字',
        'any.required': '验证码不能为空'
      })
  })
  
  return schema.validate(data)
}

/**
 * 手机验证码验证
 */
const validatePhoneVerification = (data) => {
  const schema = Joi.object({
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .required()
      .messages({
        'string.base': '手机号必须是字符串',
        'string.pattern.base': '手机号格式不正确',
        'any.required': '手机号不能为空'
      }),
    
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.base': '验证码必须是字符串',
        'string.length': '验证码必须是6位数字',
        'string.pattern.base': '验证码必须是6位数字',
        'any.required': '验证码不能为空'
      })
  })
  
  return schema.validate(data)
}

/**
 * 密码重置验证
 */
const validatePasswordReset = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': '邮箱必须是字符串',
        'string.email': '邮箱格式不正确',
        'any.required': '邮箱不能为空'
      }),
    
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.base': '验证码必须是字符串',
        'string.length': '验证码必须是6位数字',
        'string.pattern.base': '验证码必须是6位数字',
        'any.required': '验证码不能为空'
      }),
    
    newPassword: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
      .required()
      .messages({
        'string.base': '新密码必须是字符串',
        'string.min': '新密码至少需要6个字符',
        'string.max': '新密码不能超过128个字符',
        'string.pattern.base': '新密码必须包含至少一个大写字母、一个小写字母和一个数字',
        'any.required': '新密码不能为空'
      }),
    
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': '确认新密码与新密码不匹配',
        'any.required': '确认新密码不能为空'
      })
  })
  
  return schema.validate(data)
}

/**
 * 用户ID验证
 */
const validateUserId = (userId) => {
  const schema = Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '用户ID必须是数字',
      'number.integer': '用户ID必须是整数',
      'number.positive': '用户ID必须是正数',
      'any.required': '用户ID不能为空'
    })
  
  return schema.validate(userId)
}

/**
 * 用户搜索验证
 */
const validateUserSearch = (data) => {
  const schema = Joi.object({
    keyword: Joi.string()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'string.base': '搜索关键词必须是字符串',
        'string.min': '搜索关键词至少需要1个字符',
        'string.max': '搜索关键词不能超过100个字符'
      }),
    
    status: Joi.string()
      .valid('active', 'inactive', 'banned')
      .optional()
      .messages({
        'any.only': '用户状态只能是 active、inactive 或 banned'
      }),
    
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional()
      .messages({
        'any.only': '性别只能是 male、female 或 other'
      }),
    
    startDate: Joi.date()
      .optional()
      .messages({
        'date.base': '开始日期必须是有效日期'
      }),
    
    endDate: Joi.date()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': '结束日期必须是有效日期',
        'date.min': '结束日期不能早于开始日期'
      }),
    
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': '页码必须是数字',
        'number.integer': '页码必须是整数',
        'number.min': '页码必须大于等于1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': '每页数量必须是数字',
        'number.integer': '每页数量必须是整数',
        'number.min': '每页数量必须大于等于1',
        'number.max': '每页数量不能超过100'
      }),
    
    sortBy: Joi.string()
      .valid('id', 'username', 'email', 'createdAt', 'lastLoginAt')
      .default('id')
      .messages({
        'any.only': '排序字段只能是 id、username、email、createdAt 或 lastLoginAt'
      }),
    
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': '排序方式只能是 asc 或 desc'
      })
  })
  
  return schema.validate(data)
}

/**
 * 用户状态更新验证
 */
const validateUserStatusUpdate = (data) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid('active', 'inactive', 'banned')
      .required()
      .messages({
        'any.only': '用户状态只能是 active、inactive 或 banned',
        'any.required': '用户状态不能为空'
      }),
    
    reason: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.base': '状态变更原因必须是字符串',
        'string.max': '状态变更原因不能超过500个字符'
      })
  })
  
  return schema.validate(data)
}

/**
 * 用户偏好设置验证
 */
const validateUserPreferences = (data) => {
  const schema = Joi.object({
    language: Joi.string()
      .valid('zh-CN', 'en-US', 'ja-JP')
      .default('zh-CN')
      .messages({
        'any.only': '语言只能是 zh-CN、en-US 或 ja-JP'
      }),
    
    theme: Joi.string()
      .valid('light', 'dark', 'auto')
      .default('light')
      .messages({
        'any.only': '主题只能是 light、dark 或 auto'
      }),
    
    timezone: Joi.string()
      .default('Asia/Shanghai')
      .messages({
        'string.base': '时区必须是字符串'
      }),
    
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      push: Joi.boolean().default(true),
      marketing: Joi.boolean().default(false)
    }).optional(),
    
    privacy: Joi.object({
      showProfile: Joi.boolean().default(true),
      showEmail: Joi.boolean().default(false),
      showPhone: Joi.boolean().default(false),
      allowSearch: Joi.boolean().default(true)
    }).optional()
  })
  
  return schema.validate(data)
}

module.exports = {
  validateUserRegister,
  validateUserLogin,
  validateUserProfileUpdate,
  validatePasswordChange,
  validateEmailVerification,
  validatePhoneVerification,
  validatePasswordReset,
  validateUserId,
  validateUserSearch,
  validateUserStatusUpdate,
  validateUserPreferences
}
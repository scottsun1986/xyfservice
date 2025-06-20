const http = require('http')
const config = require('./config/config')

const options = {
  host: 'localhost',
  port: config.server.port || 3000,
  path: '/health',
  timeout: 2000
}

const request = http.request(options, (res) => {
  console.log(`健康检查状态码: ${res.statusCode}`)
  if (res.statusCode === 200) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})

request.on('error', (err) => {
  console.log('健康检查错误:', err.message)
  process.exit(1)
})

request.on('timeout', () => {
  console.log('健康检查超时')
  request.destroy()
  process.exit(1)
})

request.end()
const redisSetting = require('./redisSetting')
const redis = require('redis')
const redisClient = redis.createClient(process.env.REDIS_URL || { port: redisSetting.port, host: redisSetting.host })

// ***********************   to use in heroku   ***********************
// const heroku_redis_password = 'pa1fa3945bc6286338291f048bd62b3987813248b28bd3af99c34b53e40563ddd'
// redisClient.auth(heroku_redis_password, function (err) {
//     if (err) throw err
// })
// *********************** *********************** ***********************

// redisClient.auth(redisSetting.password, function (err) {
//     console.log('redis authorized')
//     if (err) throw err
// })
redisClient.on('error', function (err) {
    console.log('Redis error: ' + err)
})
module.exports = redisClient
const redisSetting = require('./redisSetting')
const redis = require('redis')
// const redisClient = redis.createClient(redisSetting.port, redisSetting.host)
// const redisClient = redis.createClient(process.env.REDIS_URL || { port: redisSetting.port, host: redisSetting.host })
const redisClient = redis.createClient(process.env.REDIS_URL)
redisClient.auth(redisSetting.password, function (err) {
    if (err) throw err
})
redisClient.on('error', function (err) {
    console.log('Redis error: ' + err)
})
module.exports = redisClient
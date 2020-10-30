const redisSetting = require('./redisSetting')
const redis = require('redis')
const redisClient = redis.createClient(redisSetting.port, redisSetting.host)
redisClient.auth(redisSetting.password, function (err) {
    if (err) throw err
})
redisClient.on('error', function (err) {
    console.log('Redis error: ' + err)
})
module.exports = redisClient
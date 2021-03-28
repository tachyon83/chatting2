const redisClient = require('./redisClient')
const { promisify } = require('util')

module.exports = {
    hmset: promisify(redisClient.hmset).bind(redisClient),
    hget: promisify(redisClient.hget).bind(redisClient),
    hdel: promisify(redisClient.hdel).bind(redisClient),
    hkeys: promisify(redisClient.hkeys).bind(redisClient),

    smembers: promisify(redisClient.smembers).bind(redisClient),
    srem: promisify(redisClient.srem).bind(redisClient),
    sadd: promisify(redisClient.sadd).bind(redisClient),
    srandmember: promisify(redisClient.srandmember).bind(redisClient),

    keys: promisify(redisClient.keys).bind(redisClient),
    get: promisify(redisClient.get).bind(redisClient),
    set: promisify(redisClient.set).bind(redisClient),
    del: promisify(redisClient.del).bind(redisClient),

    llen: promisify(redisClient.llen).bind(redisClient),
    lindex: promisify(redisClient.lindex).bind(redisClient),
    rpush: promisify(redisClient.rpush).bind(redisClient),

}
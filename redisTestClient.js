var redis = require('redis');
var redisClient = redis.createClient(6379, 'localhost');
redisClient.auth('1234', function (err) {
    if (err) throw err;
});
redisClient.on('error', function (err) {
    console.log('Redis error: ' + err);
});
module.exports = redisClient;


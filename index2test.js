const redisClient = require('./config/redisClient')
const events = require('events')
const eventEmitter = new events.EventEmitter()

var number = 1
const cb = () => {
    redisClient.sadd('testSet', 'member' + number)
    number++
    eventEmitter.emit('test123')
}
module.exports = {
    tester: () => {
        setInterval(cb, 1 * 1000)
    },
    evEmitter: eventEmitter,
}
const redisClient = require('../config/redisClient');

module.exports = io => {

    io.use((socket, next) => {
        let currTime = new Date();
        let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
        console.log('io event: ', timeStamp)

        redisClient.get('sess:' + socket.request.session.id, (err, value) => {
            if (err) throw err;
            console.log('socket session id', socket.request.session.id)
            console.log('redisClient.get', value)
            next();
        })
    })

    require('./ioConnection')(io)

}
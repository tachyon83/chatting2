// important: this [cors] must come before Router
const cors = require('cors');
const app = require('express')()
app.set('port', process.env.PORT || 3000);
app.use(cors());

const server = require('http').createServer(app);
// const io = require('socket.io').listen(server);
const io = require('socket.io')(server, {
    pingTimeout: 600000,
})

io.use((socket, next) => {
    console.log('io middleware1')
    next();
})

io.on('connection', socket => {
    console.log('a new socket is connected: ', socket.id)

    // socket.use((packet, next) => {
    //     console.log('socket middleware1')
    //     next()
    // })

    let testdata = {
        num: 3,
        tit: '제목이당',
        own: '방장장',
        userNowNum: 1,
        userNum: 3
    }
    socket.emit('test', testdata)
    console.log('maybe emitted?')

    socket.on('from.client', data => {
        console.log(data)
    })
    socket.on('disconnect', reason => {
        console.log('reason: ', reason)
        if (reason === 'transport close') console.log('client side has disconnected this socket')
        else console.log('somehow disconnected', socket.id)
    })
})
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});
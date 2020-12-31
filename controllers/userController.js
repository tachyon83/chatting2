const redisClient = require('../config/redisClient');
const userDao = require('../models/userDao')
const roomLeaveProcess = require('../utils/roomLeaveProcess')
const bcrypt = require('bcrypt');
const saltRounds = 10
const passport = require('passport');


module.exports = {
    signIn: (req, res, next) => {
        passport.authenticate('local', (err, member, info) => {
            if (err) return next(err);
            if (member) {
                // when using custom callback, need to use req.logIn()

                req.logIn(member, (err) => {
                    if (err) return next(err)

                    redisClient.hmset('sessionMap', {
                        [req.session.id]: member.id,
                    })
                    redisClient.hmset('onlineUsers', {
                        [member.id]: JSON.stringify(member),
                    })
                    console.log('login successful')
                    res.json({
                        result: true,
                        code: 0,
                        packet: member.id,
                    })
                })

            } else {
                // console.log(req.flash('error'))
                console.log('login failed')
                res.json({
                    result: false,
                    code: 2,
                    packet: null,
                })
            }
        })(req, res, next)
    },

    idCheck: (req, res, next) => {
        userDao.existById(req.params.id, (err, response) => {
            if (err) return res.json({
                result: false,
                code: 3,
                packet: null,
            })
            res.json({
                result: response,
                code: response ? 0 : 1,
                packet: null,
            })
        })
    },

    signUp: (req, res, next) => {
        let password = req.body.password

        bcrypt
            .genSalt(saltRounds)
            .then(salt => {
                return bcrypt.hash(password, salt)
            })
            .then(hash => {
                // users[username] = addNewUser(username, hash)
                req.body.password = hash
                userDao.signup(req.body, (err, response) => {
                    if (err) next(err)
                    res.json({
                        result: response,
                        code: 0,
                        packet: null,
                    })
                })
            })
            .catch(err => {
                // console.error(err.message)
                console.log(err)
                res.json({
                    result: false,
                    code: 3,
                    packet: null,
                })
            })
    },

    signOut: io => {
        return (req, res, next) => {
            redisClient.hget('onlineUsers', req.session.passport.user, (err, user) => {
                if (err) return next(err)
                user = JSON.parse(user)
                let socket = io.sockets.connected[user.socketId]
                console.log('rooms', io.sockets.adapter.rooms)
                roomLeaveProcess(socket).then(() => {
                    redisClient.hdel('onlineUsers', user.id)
                    redisClient.hdel('sessionMap', req.session.id)
                    socket.disconnect()
                    req.logOut()
                    req.session.destroy(err => {
                        if (err) return next(err)
                        res.status(200).clearCookie('connect.sid').json({
                            result: true
                        })
                        console.log('signed out')
                    })
                })
            })
        }
    }
}

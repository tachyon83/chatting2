const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const userDao = require('../models/userDao')
const resCode = require('../config/resCode')
const responseHandler = require('../utils/responseHandler')
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

                    redisClient.hmset(dataMap.sessionUserMap, {
                        [req.session.id]: member.id,
                    })
                    redisClient.hmset(dataMap.onlineUserHm, {
                        [member.id]: JSON.stringify(member),
                    })
                    console.log('login successful')
                    res.json(responseHandler(true, resCode.success, member.id))
                })

            } else {
                // console.log(req.flash('error'))
                console.log('login failed')
                res.json(responseHandler(false, resCode.wrong, null))
            }
        })(req, res, next)
    },

    idCheck: (req, res, next) => {
        userDao.existById(req.params.id, (err, response) => {
            if (err) return next(err)
            res.json(responseHandler(!response, response ? resCode.exist : resCode.success, null))
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
                    if (err) {
                        err.reason = 'dbError'
                        return next(err)
                    }
                    res.json(responseHandler(response, resCode.success, null))
                })
            })
            .catch(err => next(err))
    },

    signOut: io => {
        return (req, res, next) => {
            redisClient.hget(dataMap.onlineUserHm, req.session.passport.user, (err, user) => {
                if (err) {
                    err.reason = 'noInfo'
                    return next(err)
                }
                // if (!user) return res.json({ response: 'no user' })
                user = JSON.parse(user)
                let socket = io.sockets.connected[user.socketId]
                socket.disconnect()
                // console.log('rooms', io.sockets.adapter.rooms)

                // roomLeaveProcess(socket).then(() => {
                //     redisClient.hdel('onlineUsers', user.id)
                //     redisClient.hdel('sessionMap', req.session.id)
                //     socket.disconnect()
                //     req.logOut()
                //     req.session.destroy(err => {
                //         if (err) return next(err)
                //         res.status(200).clearCookie('connect.sid').json({
                //             result: true
                //         })
                //         console.log('signed out')
                //     })
                // })
            })
        }
    }
}

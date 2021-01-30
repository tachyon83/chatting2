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
                    console.log('[USER]: Login Successful')
                    console.log()
                    res.json(responseHandler(true, resCode.success, member.id))
                })

            } else {
                console.log('[USER]: Login Failed')
                console.log()
                res.json(responseHandler(false, resCode.wrong, null))
            }
        })(req, res, next)
    },

    idCheck: (req, res, next) => {
        console.log('[USER]: IdCheck')
        console.log()
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
                    console.log('[USER]: A New User Successfully Created')
                    console.log()
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
                user = JSON.parse(user)
                let socket = io.sockets.connected[user.socketId]
                socket.disconnect()
            })
        }
    }
}

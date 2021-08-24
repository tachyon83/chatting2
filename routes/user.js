const express = require('express');
const router = express.Router();
const controller = require('../controllers/userHttpController')
const httpAuth = require('../utils/httpAuth')
const redisHandler = require('../config/redisHandler')
const errorHandler = require('../utils/errorHandler')
// const signInDevMiddleware = require('../utils/test/signInDevMiddleware')

const sessionCheckMiddleware = async (req, res, next) => {
    const existingSession = await redisHandler.get(`sess:${req.session.id}`)
    if (existingSession) {
        let err = new Error()
        err.reason = 'online'
        res.json(errorHandler(err))
    } else next()
}

module.exports = function (io) {
    router.post('/signin', sessionCheckMiddleware, controller.signIn, controller.uponSignIn)
    // router.get('/signin_dev/:username/:password', signInDevMiddleware, controller.signIn)
    // router.post('/signin_dev/:username/:password', io => {
    //     console.log(io.sockets.sockets)
    //     return (req, res) => {
    //         res.status(200).json()
    //     }
    // })
    router.get('/idcheck/:id', controller.idCheck)
    router.post('/signup', controller.signUp)
    router.get('/signout', httpAuth, controller.signOut(io))

    return router
}

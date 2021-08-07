const express = require('express');
const router = express.Router();
const controller = require('../controllers/userHttpController')
const httpAuth = require('../utils/httpAuth')
// const signInDevMiddleware = require('../utils/test/signInDevMiddleware')


module.exports = function (io) {
    router.post('/signin', controller.signIn)
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

const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController')
const httpAuth = require('../utils/httpAuth')

module.exports = function (io) {
    router.post('/signin', controller.signIn)
    router.post('/idcheck/:id', controller.idCheck)
    router.post('/signup', controller.signUp)
    router.get('/signout', httpAuth, controller.signOut(io))
    return router
}

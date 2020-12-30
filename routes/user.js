const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController')

module.exports = function (io) {
    // console.log(io)
    router.post('/signin', controller.signIn)
    router.post('/idcheck/:id', controller.idCheck)
    router.post('/signup', controller.signUp)
    router.get('/signout', controller.signOut(io))
    return router
}

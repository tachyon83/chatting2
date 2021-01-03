const responseHandler = require('./responseHandler')
const resCode = require('../config/resCode')

module.exports = (req, res, next) => {
    // console.log(req.session.cookie)
    if (req.isAuthenticated()) next()
    res.json(responseHandler(false, resCode.notAuth, null))

}
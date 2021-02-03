const responseHandler = require('./responseHandler')
const resCode = require('../config/resCode')

module.exports = (req, res, next) => {
    // console.log(req.session.cookie)
    if (req.isAuthenticated()) {
        console.log('[httpAUTH]: Authenticated.')
        console.log()
        next()
    }
    else res.json(responseHandler(false, resCode.notAuth, null))
}
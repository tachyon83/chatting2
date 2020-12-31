const responseHandler = require('./responseHandler')

module.exports = err => {
    console.log(err)
    return responseHandler(false, err.reason, null)
}
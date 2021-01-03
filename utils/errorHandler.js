const resCode = require('../config/resCode')
const responseHandler = require('./responseHandler')

module.exports = err => {
    console.log(err)
    return responseHandler(false, err.reason ? resCode[err.reason] : resCode.error, null)
}
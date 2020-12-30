const packetHandler = require('./packetHandler')

module.exports = err => {
    console.log(err)
    return packetHandler(false, err.reason, null)
}
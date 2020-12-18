// join date, group name, pw hint, title?(room owner)
// login time, logout time
const bcrypt = require('bcrypt');
const saltRounds = 10

// const encrypt = (saltRounds, password) => {
//     let res = null
//     bcrypt.genSalt(saltRounds).then(salt => {
//         return bcrypt.hash(password, salt)
//     }).then(hash => {
//         res = hash
//     }).catch(err => console.error(err.message))
//     return res
// }

module.exports = {
    users: {
        chris: {
            id: 'chris',
            pw: '111',
            nick: 'chrispower',
            img: null,
            status: -1,
            friendsList: [],
            banList: [],
            socketId: null,
        },
        paul: {
            id: 'paul',
            pw: '111',
            nick: 'paulpower',
            img: null,
            status: 0,
            friendsList: [],
            banList: [],
            socketId: null,
        },
        tom: {
            id: 'tom',
            pw: '111',
            nick: 'cruz',
            img: null,
            status: 0,
            friendsList: [],
            banList: [],
            socketId: null,
        },
        mary: {
            id: 'mary',
            pw: '111',
            nick: 'cruz',
            img: null,
            status: 0,
            friendsList: [],
            banList: [],
            socketId: null,
        },
        jane: {
            id: 'jane',
            pw: '111',
            nick: 'cruz',
            img: null,
            status: 0,
            friendsList: [],
            banList: [],
            socketId: null,
        },
        alice: {
            id: 'alice',
            pw: '111',
            nick: 'cruz',
            img: null,
            status: 0,
            friendsList: [],
            banList: [],
            socketId: null,
        }
    },
    addNewUser: (id, pw) => {
        return {
            id: id,
            pw: pw,
            nick: null,
            img: null,
            status: -1,
            friendsList: [],
            banList: [],
            socketId: null,
        }
    }
};
// *** when using passport,
// body-parser, cookie-parser, express-session,
// passport, passport-local, and of course express are required
// passport-google-oauth, passport-facebook, passport-twitter,
// passport-kakao, passport-naver

const bcrypt = require('bcrypt');
// const saltRounds = 10

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// const MyTestModel = require('./models/MyTestModel');
// const myTestModel = new MyTestModel();
// const users] is not needed because it will have been imported where this passportConfig is imported
// no, that is not true
// maybe then, users is newly imported everytime this file is executed
// const users = require('../models/users').users
const userDao = require('../models/userDao')

module.exports = () => {

    // serializeUser and deserializeUser are both required for passport to work

    // this first variable in this 'serialize' function becomes
    // the key of req.session.passport.[key]
    passport.serializeUser((user, done) => {
        // req.session.passport.user에 저장
        // done(null, user.pID);
        // console.log('inside serialize', req.session.passport.user)<-not possible
        console.log('now serialized')
        done(null, user.id);
    })
    passport.deserializeUser((id, done) => {
        // console.log('session', req.session) <-undefined maybe
        // myTestModel.findById(id, (err, user) => {
        //     if (err) return done(err, null);
        //     done(null, user);
        // })

        // if authenticated (users[id]), 
        // console.log('deserialize called and req.user is registered')

        if (users[id]) return done(null, users[id]);
        else return done(null, null)


        // now user is registered into req.user
        // Cookie 의 secure 설정이 true 인 경우 deserialize불가
        // 세션 스토어 쿠키 객체의 secure 값을 false-> 해결
        // done(null, id);
    })
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        session: true, //세션에 저장 여부
        // passReqToCallback:false,
        passReqToCallback: true,
    }, (req, id, pw, done) => {
        console.log('in passport config')

        userDao.findById(id, (err, response) => {
            if (err) return done(err, false)
            if (response) {
                console.log(pw)
                console.log(response.response)
                console.log(response.response.password)
                bcrypt.compare(pw, response.response.password, (err, res) => {
                    if (err) return done(err, false)
                    console.log(res)
                    if (res) return done(null, response.response)
                    return done(null, false)
                })
            } else {
                return done(null, false)
            }
        })

        // if (!users[id]) return done(null, false);
        // if (pw === users[id].pw) {
        //     console.log('inside passporconfig.bcrypt.cmpare.authenticated')
        //     console.log('before going into serialize, does session has passport?', req.session.hasOwnProperty('passport'))
        //     console.log('direct access to passport', req.session.passport)
        //     return done(null, users[id])
        // }
        // return done(null, false)
        // bcrypt.compare(pw, users[id].pw, (err, res) => {
        //     console.log('pw', pw)
        //     console.log('users[id].pw', users[id].pw)
        //     if (err) return done(err, false)
        //     if (res) {
        //         console.log('inside passporconfig.bcrypt.cmpare.authenticated')
        //         console.log('before going into serialize, does session has passport?', req.session.hasOwnProperty('passport'))
        //         console.log('direct access to passport', req.session.passport)
        //         return done(null, users[id])
        //     }
        //     return done(null, false)
        // })

        // if (!users[id]) return done(null, false);
        // if (users[id].pw == pw) return done(null, users[id]);
        // // return done(null, false, { message: "password does not match" })
        // return done(null, false)

        // myTestModel.findById(id, (err, user) => {
        //     if (err) return done(err);
        //     // third parameter is optional and used only when
        //     // the developer wants to raise error and enter some msg
        //     if (!user) return done(null, false, { message: "this ID does not exist" });
        //     if (user.pPW == pw) return done(null, user);
        //     return done(null, false, { message: "password does not match" })
        //     // return myTestModel.matchPassword(id, pw, (error, result) => {
        //     //     if (result) return done(null, result);
        //     //     return done(null, false, { message: error });
        //     // })
        // })

        // if (!users[id]) return done(null, false, { message: "this ID does not exist" });
        // if (!users[id]) return done(null, false);
        // if (users[id].pw == pw) return done(null, users[id]);
        // // return done(null, false, { message: "password does not match" })
        // return done(null, false)
    }))
}
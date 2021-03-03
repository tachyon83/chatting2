// *** when using passport,
// body-parser, cookie-parser, express-session,
// passport, passport-local, and of course express are required
// passport-google-oauth, passport-facebook, passport-twitter,
// passport-kakao, passport-naver

const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userDao = require('../models/userDao')
const redisClient = require('../config/redisClient');
const dataMap = require('./dataMap')

module.exports = () => {

    // serializeUser and deserializeUser are both required for passport to work

    // this first variable in this 'serialize' function becomes
    // the key of req.session.passport.[key]
    // in this case, 'user'

    passport.serializeUser((user, done) => {
        // when done, req.session.passport.user에 저장!
        console.log('[PASSPORT]: Now Serialized')
        console.log()
        if (user) return done(null, user.id);
        return done(null, null)
    })
    passport.deserializeUser((id, done) => {
        // at first, req.session.passport is not defined
        // through this 'deserialize' process, passport is attached

        // console.log('session', req.session) <-undefined maybe
        // console.log('deserialize called and req.user is registered')

        redisClient.hget(dataMap.onlineUserHm, id, (err, user) => {
            if (err) return done(err, null)
            return done(null, user ? id : null)
        })

        // userDao.existById(id, (err, response) => {
        //     if (err) return done(err, null)
        //     return done(null, response ? id : null)
        // })

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
        userDao.findById(id, (err, user) => {
            if (err) return done(err, false)
            if (user) {
                bcrypt.compare(pw, user.password, (err, res) => {
                    if (err) return done(err, false)
                    if (res) return done(null, user)
                    else return done(null, false)
                })
            }
            else return done(null, false)
        })
    }))
}
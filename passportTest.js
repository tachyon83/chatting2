// *** when using passport,
// body-parser, cookie-parser, express-session,
// passport, passport-local, and of course express are required
// passport-google-oauth, passport-facebook, passport-twitter,
// passport-kakao, passport-naver

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MyTestModel = require('./models/MyTestModel');
const myTestModel = new MyTestModel();

module.exports = () => {

    // serializeUser and deserializeUser are both required for passport to work

    passport.serializeUser((user, done) => {
        // req.session.passport.user에 저장
        done(null, user.pID);
    })
    passport.deserializeUser((id, done) => {
        // console.log('session', req.session) <-undefined maybe
        // myTestModel.findById(id, (err, user) => {

        //     done(null, user);
        // })
        // now user is registered into req.user

        // Cookie 의 secure 설정이 true 인 경우 deserialize불가
        // 세션 스토어 쿠키 객체의 secure 값을 false-> 해결
        done(null, id);
    })
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        session: true, //세션에 저장 여부
        // passReqToCallback:false,
        passReqToCallback: true,
    }, (req, id, pw, done) => {
        myTestModel.findById(id, (err, user) => {
            if (err) return done(err);
            // third parameter is optional and used only when
            // the developer wants to raise error and enter some msg
            if (!user) return done(null, false, { message: err });
            return myTestModel.matchPassword(id, pw, (error, result) => {
                if (result) return done(null, result);
                return done(null, false, { message: error });
            })
        })
    }))
}
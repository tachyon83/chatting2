const path = require('path')
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {

    // 현재 로그인되어있는지 확인
    // 로그인되어있을 시 (아이디와 방 위치 보여주기) 재접여부 확인
    // 재접안하면 어디로 갈것인지? (일단은 대기실로 처리)
    // 재접하면 해당 방으로 이동(방이 없으면 대기실로)
    // 근데 여기서 또...원래 대기실이었으면 물어볼거 없이 그냥
    // 바로 대기실로 가게 할지..?

    console.log('to see if authenticated', req.isAuthenticated())
    // console.log(req.session.passport)
    // res.sendFile(path.join(__dirname + '/html/chat.html'));
    // res.sendFile(__dirname + '/views/index.ejs');
    // res.render('index', { locals: { username: req.session.key ? req.session.passport.user : null } })
    res.render('index', { userId: req.isAuthenticated() ? req.session.passport.user : 0 })
    // res.sendFile(__dirname)
})
router.get('/signin', (req, res) => {
    if (req.isAuthenticated()) {
        // res.render('chat', { userId: req.session.passport.user })
        // res.render('chatLobby', { userId: req.session.passport.user })
        res.render('chatLobby', {
            basicInfo: {
                userId: req.session.passport.user,
                rooms: rooms,
            }
        })
        // res.sendFile(path.join(__dirname, 'html', 'chatLobby.html'))
        // res.sendFile(path.resolve('/', '/chatLobby.html'))
    }
    res.render('signin')
})

router.get('/profile/signin', (req, res) => {
    if (req.isAuthenticated()) {
        // res.render('chat', { userId: req.session.passport.user })
        // res.render('chatLobby', { userId: req.session.passport.user })
        res.render('chatLobby', {
            basicInfo: {
                userId: req.session.passport.user,
                rooms: rooms,
            }
        })
        // res.sendFile(path.join(__dirname, 'html', 'chatLobby.html'))
    }
    else res.render('signin')
})
// router.post('/profile/signin', passport.authenticate('local', {
//     failureRedirect: '/profile/failure',
//     failureFlash: true
// }), (req, res) => {
//     req.session.save(function () {
//         // console.log(req.user)
//         res.redirect('/profile/success');
//     })
// })
// router.get('/profile/success', (req, res) => {
//     userMap[req.user.id] = null;
//     res.render('chat', { userId: req.session.passport.user ? req.session.passport.user : null })
// })
router.route('/profile/failure').get((req, res) => {
    console.log('in profile/failure')
    // res.sendFile(__dirname + "/html/signin.html")
    res.render('signin')
})

module.exports = router;
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    console.log(req.isAuthenticated())
    console.log(req.session.passport)
    // res.sendFile(path.join(__dirname + '/html/chat.html'));
    // res.sendFile(__dirname + '/views/index.ejs');
    // res.render('index', { locals: { username: req.session.key ? req.session.passport.user : null } })
    res.render('index', { userId: req.isAuthenticated() ? req.session.passport.user : 0 })
})
router.get('/signin', (req, res) => {
    if (req.isAuthenticated()) res.render('chat', { userId: req.session.passport.user })
    res.render('signin')
})

router.get('/profile/signin', (req, res) => {
    if (req.isAuthenticated()) res.render('chat', { userId: req.session.passport.user })
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
    // res.sendFile(__dirname + "/html/signin.html")
    res.render('signin')
})

module.exports = router;
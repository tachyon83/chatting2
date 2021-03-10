module.exports = (req, res, next) => {
    // Populate username and password before passing it on to Passport.
    req.query.username = req.params.username
    req.query.password = req.params.password
    next();
}
const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
var otpGenerator = require('otp-generator');
// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => {
	var otp = otpGenerator.generate(6, { upperCase: true, specialChars: true });
	console.log(otp);
	res.render('welcome');
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
	res.render('dashboard', {
		user: req.user
	})
);

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
var otpGenerator = require('otp-generator');
var nodemailer = require('nodemailer');

const email_add = require('./config/keys').EMAIL;
const password = require('./config/keys').PASSWORD;
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: email_add,
		pass: password
	}
});
// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => {
	res.render('welcome');
});

// Load User model
const User = require('../models/User');
const { getMaxListeners } = require('../models/User');

//Load Admin model
const Admin = require('../models/Admin');
// Login Page
router.get('/users/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/users/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/users/register', (req, res) => {
	const { name, email, password, password2, mobilenum } = req.body;
	let errors = [];

	if (!name || !email || !password || !password2 || !mobilenum) {
		errors.push({ msg: 'Please enter all fields' });
	}

	if (password != password2) {
		errors.push({ msg: 'Passwords do not match' });
	}

	if (errors.length > 0) {
		res.render('register', {
			errors,
			name,
			email,
			password,
			password2,
			mobilenum
		});
	} else {
		User.findOne({ email: email }).then((user) => {
			if (user) {
				errors.push({ msg: 'Email already exists' });
				res.render('register', {
					errors,
					name,
					email,
					password,
					password2,
					mobilenum
				});
			} else {
				const newUser = new User({
					name,
					email,
					password,
					mobilenum
				});

				bcrypt.genSalt(10, (err, salt) => {
					bcrypt.hash(newUser.password, salt, (err, hash) => {
						if (err) throw err;
						newUser.password = hash;
						newUser
							.save()
							.then((user) => {
								req.flash('success_msg', 'You are now registered and can log in');
								res.redirect('/users/login');
							})
							.catch((err) => console.log(err));
					});
				});
			}
		});
	}
});

// Login
router.post('/users/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect: '/dashboard',
		failureRedirect: '/users/login',
		failureFlash: true
	})(req, res, next);
});

var today = new Date();

var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

var dateTime = date + ' ' + time;
// var curday = function(sp) {
// 	today = new Date();
// 	var dd = today.getDate();
// 	var mm = today.getMonth() + 1; //As January is 0.
// 	var yyyy = today.getFullYear();

// 	if (dd < 10) dd = '0' + dd;
// 	if (mm < 10) mm = '0' + mm;
// 	return dd + sp + mm + sp + yyyy;
// };
// var today_date = curday('-');
// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
	res.render('dashboard', {
		user: req.user,
		today_date: dateTime
	});
});
router.get('/users/verify-otp', ensureAuthenticated, (req, resp) => {
	resp.render('verify.ejs');
});
var otp = '';
router.post('/users/enter-otp', (req, resp) => {
	otp = otpGenerator.generate(6, { upperCase: true, specialChars: true });
	var email_address = req.user.email;
	var mailOptions = {
		from: 'rakeshparag876@gmail.com',
		to: email_address,
		subject: 'Attendance OTP',
		html: `<p><b>${otp}</b> is your One Time Password.\n Valid for 2 minutes only</p>`
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
			resp.redirect('/users/verify-otp');
		}
	});
});
router.get('/failure', (req, resp) => {
	resp.render('failure.ejs');
});
router.post('/users/verify-otp', (req, resp) => {
	console.log(req.body.verifyotp);
	var attendee_name = req.user.name;
	var attendee_email = req.user.email;
	var attendee_mobilenum = req.user.mobilenum;
	var Attendee = {
		attendee_name: attendee_name,
		attendee_email: attendee_email,
		attendee_mobilenum: attendee_mobilenum
	};
	console.log(Attendee);
	var entered_otp = req.body.verifyotp;
	if (entered_otp == otp) {
		Admin.create(Attendee, (err, newlyCreated) => {
			if (err) {
				console.log(err);
			} else {
				resp.redirect('/users/logout');
			}
		});
	} else {
		resp.redirect('/failure');
	}
});
router.get('/Admin', (req, resp) => {
	Admin.find({}, (err, allAttendees) => {
		if (err) {
			console.log(err);
		} else {
			console.log(allAttendees);
			resp.render('Admin.ejs', { allAttendees: allAttendees });
		}
	});
});
// Logout
router.get('/users/logout', (req, res) => {
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});

module.exports = router;

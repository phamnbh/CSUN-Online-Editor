var express = require('express');
var router = express.Router();
var User = require('../models/users');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
let Article = require('../models/article')
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var config = require('../config/main');

require('../config/passport-jwt.js')(passport);

router.get('/dashboard', passport.authenticate('jwt', { session: false }), function(req, res) {
  res.send('It worked! User id is: ' + req.user._id + '.');
});


// Register new users
router.post('/register', function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	//Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		console.log("errors")
		res.json({
			errors : errors
		})
	} else {
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password
		})

		User.createUser(newUser, function(err, user){
			if(err){
				throw err
			} else {
				res.json({
					msg: "Registration COMPLETE!",
					user: user.username
				})
			}
			console.log(user)
		})

		// req.flash('success_msg', 'Registration Complete!')
		// res.redirect('/users/login')
	}

	console.log(name)
});

// Authenticate the user and get a JSON Web Token to include in the header of future requests.
router.post('/login', function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.send({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
    	User.comparePassword(req.body.password, user.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          var token = jwt.sign(JSON.stringify(user), config.secret);
          res.json({ success: true, token: 'JWT ' + token });
        } else {
          res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

module.exports = router;

//////////////////////////////////////////////////////////////////
// router.get('/signup', function(req, res){
// 	res.render('signup');
// });

// // Login
// router.get('/login', function(req, res){
// 	res.render('login');
// });

// router.post('/signup', function(req, res){
// 	var name = req.body.name;
// 	var email = req.body.email;
// 	var username = req.body.username;
// 	var password = req.body.password;
// 	var password2 = req.body.password2;

// 	//Validation
// 	req.checkBody('name', 'Name is required').notEmpty();
// 	req.checkBody('email', 'Email is required').notEmpty();
// 	req.checkBody('email', 'Email is not valid').isEmail();
// 	req.checkBody('username', 'Username is required').notEmpty();
// 	req.checkBody('password', 'Password is required').notEmpty();
// 	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

// 	var errors = req.validationErrors();

// 	if(errors){
// 		console.log("errors")
// 		res.render('signup', {
// 			errors : errors
// 		})
// 	} else {
// 		var newUser = new User({
// 			name: name,
// 			email: email,
// 			username: username,
// 			password: password
// 		})

// 		User.createUser(newUser, function(err, user){
// 			if(err) throw err
// 			console.log(user)
// 		})

// 		req.flash('success_msg', 'Registration Complete!')
// 		res.redirect('/users/login')
// 	}

// 	console.log(name)
// });

// passport.use(new LocalStrategy(
// 	function(username, password, done) {
// 		console.log("hi")
// 		User.getUserByUsername(username, function(err, user){
// 			if(err) throw err;
// 			if(!user){
// 				return done(null, false, {message: 'Unknown User'})
// 			}

// 			User.comparePassword(password, user.password, function(err, isMatch){
// 				if(err) throw err
// 				if(isMatch){
// 					return done(null, user)
// 				} else {
// 					return done(null, false, {message: "Invalid Password"})
// 				}
// 			})
// 		})
// 	}
// ));

// passport.serializeUser(function(user, done) {
// 	done(null, user.id);
// });

// passport.deserializeUser(function(id, done) {
// 	User.getUserById(id, function(err, user) {
// 		done(err, user);
// 	});
// });

// // router.post('/login',
// // 	passport.authenticate('local', {successRedirect: '/', failureRedirect: 'login',failureFlash: true }),function(req, res) {res.redirect('/')});

// router.post('/login',
// 	passport.authenticate('local', {
// 		successRedirect:'/users/dashboard',
// 		failureRedirect:'/users/login',
// 		failureFlash: true
// 	}),function(req, res) {
// 			res.redirect('/users/dashboard')
// });


// router.get('/logout', function(req, res){
// 	req.logout();
// 	req.flash('success_msg', 'You are logged out');
// 	res.redirect('/users/login');
// });

// module.exports = router;
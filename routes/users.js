var express = require('express');
var router = express.Router();
var User = require('../models/users');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
let Article = require('../models/article');
var ObjectId = require('mongoose').Types.ObjectId;
var bodyParser = require('body-parser');

var multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({storage : storage})
var Tesseract = require('tesseract.js')
var ocrText = ''



router.get('/dashboard', function(req, res, next) {
  console.log("We them boys1");

	if(req.user){
    var ids = []

    console.log("we the user id: ", req.user._id);
    console.log("we the user email: ", req.email);
    console.log("number of documents user has: ", req.user.documents.length);

    for (var i = 0; i < req.user.documents.length; i++) {
      console.log("Do we ever run?");
      var id = req.user.documents[i].reference
      ids.push(id)
    }

    console.log("Number of documents in array ids: ", ids.length);
    console.log("The ids: \n");

    ids.forEach(element => {
      console.log(typeof element)
    });

    Article.find({
      '_id' : {$in : ids}
    }, function(err, docs){
      res.render('dashboard', { 
      title: 'Virtual Version',
      name: req.user.name,
      user: req.user,
      documents: encodeURIComponent(JSON.stringify(docs))
      });
    })
	} else {
    console.log("we them boys2");
    res.redirect('/')
	}
});

router.post('/dashboard', function(req, res){
  console.log(req.body._id)
  User.update(
    {_id: req.user._id}, 
    { $pull: { documents: { reference: req.body._id}}},
    {multi:true },
    function(err, obj){
      if(err){
        console.log(err)  
      }
      console.log(obj)
    }
  )

})

router.get('/agenda', function(req, res){
  console.log(req.user.events)
  res.render('agenda', {events:req.user.events, name: req.user.name})
})

router.post('/agenda', function(req, res){
  console.log(req.body)
  let inc = req.body
  console.log("inc:", inc)
  req.user.events.push(inc)
  req.user.save()
})

router.post('/agenda-del', function(req,res) {
  console.log("del" + JSON.stringify(req.body))
  console.log(req.body.title)
  User.update(
    {_id:req.user._id}, 
    { $pull: { events: { title:req.body.title, end:req.body.end, start:req.body.start}}},
    {multi:true },
    function(err, obj){
      if(err){
        console.log(err)  
      }
      console.log(obj)
      
    }
  )
})

router.post('/ocr', upload.single('userFile'), function (req, res) {
  Tesseract.recognize(req.file.buffer).then(function(result){
      //console.log(result)
      console.log("loading...")
      ocrText = result.text
      delta = {ops:[{insert: result.text}]}
      console.log(result.confidence)

      let article = new Article()
      article.title = "Untitled Document"
      article.author = req.user.name
      article.body = delta

      let id = ""

      article.save(function(err){
        if(err){
          console.log(err)
          return
        } else {
          console.log(article)
          var doc = {"title": article.title, "reference":article.id}
          req.user.documents.push(doc)
          req.user.save()
          res.redirect('/edit/'+article.id)
        }
      })
  })
})

router.get('/signup', function(req, res){
	res.render('signup');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

router.post('/signup', function(req, res){
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
		res.render('signup', {
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
			if(err) throw err
			console.log(user)
		})

		req.flash('success_msg', 'Registration Complete!')
		res.redirect('/users/login')
	}

	console.log(name)
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, function(err, user){
			if(err) throw err;
			if(!user){
				return done(null, false, {message: 'Unknown User'})
			}

			User.comparePassword(password, user.password, function(err, isMatch){
				if(err) throw err
				if(isMatch){
					return done(null, user)
				} else {
					return done(null, false, {message: "Invalid Password"})
				}
			})
		})
	}
));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err, user);
	});
});


router.post('/login',
	passport.authenticate('local', {
		successRedirect:'/users/dashboard',
		failureRedirect:'/users/login',
		failureFlash: true
	}),function(req, res) {
			res.redirect('/users/dashboard')
});


router.get('/logout', function(req, res){
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});

router.get('/forgot', function(req, res){
	res.render('forgot', {
		users: req.user
	})
})

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
      	if (err) {
          return console.log(err);
		}
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (err) {
          return console.log(err);
		}
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
    	console.log(user.email)
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        secure: 'false',
        auth: {
          user: 'contactvirtualversion@gmail.com',
          pass: 'CSUN123!'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'contactvirtualversion@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
      	if (err) {
          return console.log(err);
		}
        req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        User.setPassword(user);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        secure: 'false',
        auth: {
          user: 'contactvirtualversion@gmail.com',
          pass: 'CSUN123!'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'contactvirtualversion@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/users/login');
  });
});



module.exports = router;
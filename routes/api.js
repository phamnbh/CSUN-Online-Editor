var express = require('express');
var router = express.Router();
var User = require('../models/users');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Article = require('../models/article')
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var config = require('../config/main');
var ObjectId = require('mongoose').Types.ObjectId; 

var multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({storage : storage})
var Tesseract = require('tesseract.js')
var ocrText = ''


require('../config/passport-jwt.js')(passport);

router.get('/dashboard', passport.authenticate('jwt', { session: false }), function(req, res) {
  res.send(req.user);
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
          res.json({ success: true, id: user._id, token:"JWT " + token });
        } else {
          res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

router.get('/:id', function(req, res, next) {
	var id = req.params.id
    Article.findById(new ObjectId(id), function(err, doc){
    	if(err){
    		console.log(err)
    	} else {
    		res.send(JSON.stringify(doc.body))
    	}
    })
})

router.post('/upload', upload.any(), function (req, res) {
  // Tesseract.recognize(req.file.buffer)
  //   .progress(message => console.log(message))
  //   .catch(err => console.error(err))
  //   .then(result => console.log(result.text))
  //   .finally(resultOrError => console.log(resultOrError))
  Tesseract.recognize(req.files[0].buffer).then(function(result){
      console.log(result)
      console.log("loading...")
      ocrText = result.text
      delta = {ops:[{insert: result.text}]}
      console.log(result.confidence)
      res.send(delta)
  })
})

module.exports = router;
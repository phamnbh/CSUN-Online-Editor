var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	if(req.user){
		res.render('index', { 
		title: 'Virtual Version',
		username: req.user.username,
		user: req.user
		});
	} else {
		res.render('index', { 
		title: 'Virtual Version'
		});
	}
});

module.exports = router;

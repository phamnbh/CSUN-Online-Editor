var express = require('express');
var router = express.Router();
let Article = require('../models/article')

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index')
	// if(req.user){
	// 	res.render('index', { 
	// 	title: 'Virtual Version',
	// 	username: req.user.username,
	// 	user: req.user,
	// 	documents: req.user.documents
	// 	});
	// } else {
	// 	res.render('index', { 
	// 	title: 'Virtual Version'
	// 	});
	// }
});

module.exports = router;

var express = require('express');
var router = express.Router();
let Article = require('../models/article')

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index')
});

module.exports = router;

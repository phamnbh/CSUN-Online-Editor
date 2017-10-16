var express = require('express');
var router = express.Router();

var multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({storage : storage})
var Tesseract = require('tesseract.js')

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { 
  		title: 'Virtual Version' 
	});
});

router.post('/', upload.single('userFile'), function (req, res, next) {
	Tesseract.recognize(req.file.buffer).then(function(result){
        	res.header("Content-Type", "text/html; charset=utf-8")
        	res.send(result.text)
        	console.log(result.confidence)

    })
})

module.exports = router;

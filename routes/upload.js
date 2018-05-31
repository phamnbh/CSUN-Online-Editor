var express = require('express');
var router = express.Router();

var multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({storage : storage})
var Tesseract = require('tesseract.js')
var ocrText = ''
/* GET upload page. */
router.get('/', function(req, res, next) {
	res.render('upload', { 
		title: 'Virtual Version' 
	});
});

router.post('/', upload.single('userFile'), function (req, res, next) {
	Tesseract.recognize(req.file.buffer).then(function(result){
			console.log("loading...")
			ocrText = result.text
			delta = [{insert: result.text}]
			console.log(result.confidence)
			
			res.render('edit', { 
				doc: JSON.stringify(delta),
				name: req.user.name
			});
	})
})

module.exports = router;

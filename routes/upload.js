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
			console.log(result)
			ocrText = result.text
			console.log(result.confidence)
			
			res.render('new', { 
				title: "upload",
				ocr: ocrText
			})
	})
})

module.exports = router;

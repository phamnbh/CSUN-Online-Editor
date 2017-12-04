var express = require('express');
var router = express.Router();
var Article = require('../models/article')
var User = require('../models/users');
var ObjectId = require('mongoose').Types.ObjectId; 


/* GET home page. */
router.get('/new', function(req, res, next) {
	res.render('new', { 
		title: 'Virtual Version', 
		ocr: 'Hello, world!'
	});
});

router.get('/:id', function(req, res, next) {
	let id = req.params.id
	console.log(id)
	Article.findById(new ObjectId(id), function(err, article){
		console.log(article)
		console.log(req.params.id)
		console.log(new ObjectId(req.params.id))
		console.log(article.body)

		res.render('edit', { 
		title: 'Virtual Version', 
		ocr: 'Hello, world!',
		doc: JSON.stringify(article.body.ops)
		});

	})
})

router.post('/:id', function(req, res, next) {
	let id = req.params.id
	console.log(req.body)
	Article.findById(new ObjectId(id), function(err, doc){
		if (err) {
			return handleError(err)
		} else {
			if(!doc){
				console.log("not found")
			} else{
				doc.body = req.body
				doc.save(function(err){
					if(err){
						return
					} else {
						console.log("Updated")
					}
				})
			}
		}
	})
})

router.post('/new', function(req, res, next) {
	console.log(req.body)
	let article = new Article({
		title: req.body.title,
		author: req.user.username,
		body: req.body.content
	})
	article.save(function(err){
		if(err){
			console.log(err)
			return
		} else {
			console.log(article)
			var doc = {"title": article.title, "reference":article.id}
			// User.findOneAndUpdate({username:req.user.username}, {$push: {documents: doc}})
			req.user.documents.push(doc)
			req.user.save()
		}
	})
})

module.exports = router;

var express = require('express');
var router = express.Router();
var Article = require('../models/article')
var User = require('../models/users');
var ObjectId = require('mongoose').Types.ObjectId; 
var bodyParser = require('body-parser');
var async = require('async');
var pdf = require('pdfkit');
var fs = require('fs');
var mongoose = require('mongoose');

//////EDITS////




var socketApi = require('../socketApi');
var io = socketApi.io;

//allClients is a dictionary/hashmap of the different rooms
//roomID:{number of users in the room:, current content of the document: }
var allClients = {};
var tempText = [];

//Open new socket for whenever a user accesses /edit/...
io.sockets.on('connection', function(socket) {
	//Get room name (file id) from the client side
	//Create/join room
    socket.on('room', function(room) {
        socket.join(room);
	});

    //Emit data to all sockets in the room
    //Keeps the file in sync across users
    socket.on('client', function(data){
    	let rooms = Object.keys(socket.rooms);
    	socket.to(rooms[1]).emit('server', data['delta'])

    	allClients[rooms[1]].body = data['oldDelta']
    })

    //Update allClient - Save the current body of the file into a allClients
    //                 - Upadte the number of users
    //                 - if no users are connected to the file then save to database
    socket.on('disconnecting', function(){
    	var self = this;
    	var rooms = Object.keys(self.rooms);
    	rooms.forEach(function(room){
	        if(room in allClients){
	        	allClients[room].numUsers -= 1
	        	console.log(room, allClients[room])
	        	if (allClients[room].numUsers == 0){
	        		Article.findById(new ObjectId(room), function(err, doc){
	        			doc.body = allClients[room].body
	        			doc.lastModified = new Date()
	        			doc.save()
	        			delete allClients[room]
	        		})
	        	}
	        }
    	});
	});

    socket.on('disconnect', function() {
		console.log('Got disconnect!');
   });
});


//Route for new document
router.get('/new/', function(req, res) {

	  let article = new Article();
      article.title = "Untitled Document";
      article.author = req.user.name;
	  article.body = "";
	  
	  //saving article to the 'articles' collection in the database
	  article.save(function(err){
	  if(err)
		  return console.error(err);
	  });

	var doc = {"title": article.title, "reference":article.id};
	
	// Adding/updating the newly created article to the 'user' model in the 'documents' data field.
	User.findOneAndUpdate(
		{_id: req.user._id},
		{$push: {documents: doc}},		// adding an element to an existing array in the document
		function (err, numberAffected){
			if (err)
				console.log(err)
			if (numberAffected){
				console.log("SUCCESSSS!!!!! FINALLYY!")
				res.redirect('/edit/'+ article.id)
			}
		}
	);


	// User.findOne({_id: req.user._id }, function(err, user){
	// 	var arrayOfDocsToSave = user.documents;
	// 	// console.log(`doc: ${article.title} , ${article.id}`);
	// 		// user.documents = arrayOfDocsToSave.push(doc);
	// 	console.log(typeof arrayOfDocsToSave);

	// 	// console.log(`Should be 0 ${arrayOfDocsToSave}`);

	// 	user.save(function (err) {
	// 		if(err)
	// 			console.log(err)
	// 		else{
	// 			console.log("Successs")
	// 		}
	// 	})
	// })
});


//Route to get existing documents
router.get('/:id', function(req, res, next) {
	let id = req.params.id
	var room = id

    if (room in allClients){
    	allClients[room].numUsers += 1
    	res.render('edit', { 
			title: JSON.stringify(allClients[room].title), 
			ocr: 'Hello, world!',
			doc: JSON.stringify(allClients[room].body),
			name: req.user.name
		});
    } else {
    	Article.findById(new ObjectId(room), function(err, doc){
	        	if (err) {
	        		return handleError(err)
	        	} else {
	        		if(!doc){
	        			console.log("not found")
	        		} else{
	        			allClients[room] = {body:doc.body, numUsers: 1}
	        			res.render('edit', { 
	        			title: doc.title,
	        			ocr: 'Hello, world!',
	        			doc: JSON.stringify(doc.body.ops),
	        			name: req.user.name
	        			});
	        			console.log(doc.body)
	        		}
	        	}
        })
    }
})


//Route that converts the delta object which contains the text into a pdf file
router.post('/download', function(req,res,next) {
	var docId = req.body.id

	Article.findById(new ObjectId(docId), function(err, doc){
		if (err) {
			return handleError(err)
		} else {
			if(!doc){
				console.log("not found")
			} else{
				var toDownload = new pdf
				var text = doc.body.ops[0].insert

				toDownload.pipe(fs.createWriteStream(doc.title));
				toDownload.pipe(res)
				toDownload.font('Times-Roman')
				.fontSize(12)
				.text(text)

				toDownload.end()

			}
		}
	})
})

//Route to hand the sharing documents between users
router.post('/share', function(req, res, next) {
	var shareWith = req.body.shareWith.split(',')
	var id = req.body.docId
	
	async.eachSeries(shareWith, function(email, callback){
		async.waterfall([
			//format email for use in db query
			function(done){
				fixedEmail = email.replace(/ /g,"")
				done(null, fixedEmail);
			},
			//find the user with the given email
			function(n, done){
				User.findOne({email:n}, function(err, user){
					if(err){
						console.log(err)
					}
					done(null, user)
				})
			},
			//Add the document to the users "documents" list
			//This allows for the user to access the documents
			function(user, done){
				Article.findById(new ObjectId(id), function(err, doc){
					if(err){
						console.log(err)
					}
					var doc = {"title": doc.title, "reference":doc.id}
					user.documents.push(doc)
				    user.save()
				    console.log("saved")
				})
			}
		],function(err) {
		    if (err) return next(err);
		    res.redirect('forgot');
		  })
		callback()
	})
	console.log("done")
})

//Route to change the title of the Document
router.post('/:id/changeTitle', function(req,res,next){
	let id = req.params.id
	var title = req.body.title
	
	Article.update({_id:id},{
		title: title
	}, function(err, affected, resp) {
		console.log(resp);	
	})
})

router.post('/:id', function(req, res, next) {
	let id = req.params.id
	console.log(id)
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

module.exports = router;

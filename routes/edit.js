var express = require('express');
var router = express.Router();
var Article = require('../models/article')
var User = require('../models/users');
var ObjectId = require('mongoose').Types.ObjectId; 
var bodyParser = require('body-parser');

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
	        		console.log('yo')
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


/* GET home page. */
router.get('/new', function(req, res, next) {
	res.render('new', { 
		title: 'Virtual Version', 
		ocr: 'Hello, world!',
		name: req.user.name
	});
});

router.post('/new', function(req, res, next) {
	console.log(req.body)
	let article = new Article()
	article.title = req.body.title
	article.author = req.user.name
	article.body = req.body.content
	console.log(article)
	article.save(function(err){
		if(err){
			console.log(err)
			return
		} else {
			console.log(article)
			var doc = {"title": article.title, "reference":article.id}
			req.user.documents.push(doc)
			req.user.save()
		}
	})
})

router.get('/:id', function(req, res, next) {
	let id = req.params.id
	var room = id

    if (room in allClients){
    	allClients[room].numUsers += 1
    	res.render('edit', { 
		title: 'Virtual Version', 
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
	        			title: 'Virtual Version', 
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

router.post('/share', function(req, res, next) {
	console.log("post share" ,req)
	res.redirect('/')
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

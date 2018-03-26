var express = require('express');
var router = express.Router();
var Article = require('../models/article')
var User = require('../models/users');
var ObjectId = require('mongoose').Types.ObjectId; 

var socketApi = require('../socketApi');
var io = socketApi.io;

//..............................................................
var allClients = {};
var tempText = [];

io.sockets.on('connection', function(socket) {
    // once a client has connected, we expect to get a ping from them saying what room they want to join
    // console.log('A user connected (edit.js)', socket.id);
    socket.on('room', function(room) {
        socket.join(room);
        // console.log(socket.id, ' connected to', room);
        
        // if (room in allClients){
        // 	allClients[room].numUsers += 1
        // } else {
        // 	Article.findById(new ObjectId(room), function(err, doc){
		      //   	if (err) {
		      //   		return handleError(err)
		      //   	} else {
		      //   		if(!doc){
		      //   			console.log("not found")
		      //   		} else{
		      //   			allClients[room] = {body:doc.body, numUsers: 1}
		      //   			console.log(doc.body)
		      //   		}
		      //   	}
	       //  })
        // }
	});

    socket.on('client', function(data){
    	let rooms = Object.keys(socket.rooms);
    	socket.to(rooms[1]).emit('server', data['delta'])

    	allClients[rooms[1]].body = data['oldDelta']
    	// console.log('DAAAAAAAAAAAAAAAAATAAAAAAAAAAAAAAA', data['oldDelta'])
    	// console.log('allclients', rooms[1], allClients, JSON.stringify(allClients[rooms[1]].body))

    })

    socket.on('disconnecting', function(){

    	var self = this;
    	var rooms = Object.keys(self.rooms);
    	// console.log(self)
    	rooms.forEach(function(room){
	        if(room in allClients){
	        	allClients[room].numUsers -= 1
	        	if (allClients[room].numUser == 0){
	        		Article.findById(new ObjectId(room), function(err, doc){
	        			doc.body = allClients[room].body
	        		})
	        		delete allClients[room]
	        	}
	        	// console.log("hi", room, allClients[room])
	        }
    	});
	});

    socket.on('disconnect', function() {
		console.log('Got disconnect!');
   });
});

//................................................................................


/* GET home page. */
router.get('/new', function(req, res, next) {
	res.render('new', { 
		title: 'Virtual Version', 
		ocr: 'Hello, world!'
	});
});

router.post('/new', function(req, res, next) {
	console.log(req.body)
	let article = new Article()
	article.title = req.body.title
	article.author = req.user.username
	article.body = req.body.content
	console.log(article)
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

router.get('/:id', function(req, res, next) {
	let id = req.params.id
	// console.log(id)

	var room = id

	// io.sockets.on('client', function(data){
	// 	console.log(data)
	// 	io.sockets.in(room).emit('server', data)
	// })
	// io.of("/"+id).on('connection', function(socket){
 //    	console.log('A user connected (edit.js)', socket.id);
 //    	socket.on("client", function(data){
 //    		socket.broadcast.emit('server', data)
 //    		console.log(data)
 //    	})
	// });

    if (room in allClients){
    	allClients[room].numUsers += 1
    	res.render('edit', { 
		title: 'Virtual Version', 
		ocr: 'Hello, world!',
		doc: JSON.stringify(allClients[room].body)
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
	        			doc: JSON.stringify(doc.body.ops)
	        			});
	        			console.log(doc.body)
	        		}
	        	}
        })
    }


	// Article.findById(new ObjectId(id), function(err, article){
	// 	// console.log(article)
	// 	// console.log(req.params.id)
	// 	// console.log(new ObjectId(req.params.id))
	// 	// console.log(article.body)
	// 	console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", allClients[room])
	// 	res.render('edit', { 
	// 	title: 'Virtual Version', 
	// 	ocr: 'Hello, world!',
	// 	doc: JSON.stringify(article.body.ops)
	// 	});

	// })
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

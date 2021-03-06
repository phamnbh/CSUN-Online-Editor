// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model

var userSchema = mongoose.Schema({
    username: {
        type: String,
        index:true
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    name: {
        type: String
    },
    documents: {
        type: [{title: String, reference: Object}]
    },
    events: {
        type:[{_id: false, title: String, start: String, end: String, allDay: String}]
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date

});


// create the model for users and expose it to our app
var User = module.exports = mongoose.model('User', userSchema);

module.exports.createUser = function(newUser, callback){
    var saltRounds = 10
    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(newUser.password, salt, null,function(err, hash) {
            newUser.password = hash
            newUser.save(callback)
        });
    });
}

module.exports.setPassword = function(user, callback){
    var saltRounds = 10
    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(user.password, salt, null,function(err, hash) {
            user.password = hash
            user.save(callback)
        });
    });
}

module.exports.getUserByUsername = function(username, callback){
    var query = {username: username};
    User.findOne(query, callback);     
}

module.exports.getUserById = function(id, callback){
    User.findById(id, callback)
}


module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        if(err) throw err
        callback(null, isMatch)
    });

}
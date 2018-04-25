let mongoose = require('mongoose')

let articleSchema = mongoose.Schema({
	title:{
		type: String,
		required: true
	},

	author:{
		type: String,
		required: true
	},

	body:{
		type: Object,
		required: true
	},

	lastModified:{
		type: Object
	}
});

let Article = module.exports = mongoose.model('Article', articleSchema)
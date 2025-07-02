const mongoose = require('mongoose');

let postSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    date : {
        type : Date,
        default : Date.now
    },
    likes:[{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    }],
    content : String

});

module.exports = mongoose.model('post', postSchema);
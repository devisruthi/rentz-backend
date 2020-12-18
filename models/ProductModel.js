const mongoose = require('mongoose');
const UserModel = require('./UserModel');

const ProductSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    monthlyRent:{
        type: Number,
        required: false
    },
    description: {
        type: {
            age: String,
            dimension: String,
            comments: String
        },
        required: false
    },
    images:{
        type: [String],
        required: false
    },
    sellerEmail: {
        type: String,
        required: true
    } 
})

const ProductModel = mongoose.model('products', ProductSchema);

module.exports = ProductModel;
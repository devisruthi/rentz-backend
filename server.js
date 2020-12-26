// Import the main express file as a function
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const UserRoutes = require('./routes/UserRoutes');
const ProductRoutes = require('./routes/ProductRoutes');
const passport = require('passport');
const initPassportStrategy = require('./passport-config');
const cloudinary = require('cloudinary');
const expressFormData = require('express-form-data');
require('dotenv').config();


// Invoke express
const server = express();
server.use(cors());
server.use(bodyParser.urlencoded({
    extended: false
}));
server.use(bodyParser.json());

// configure express to use passport
server.use(passport.initialize());
// configure passport to use passport-jwt
initPassportStrategy(passport);

// configure express to read file attachments
server.use(expressFormData.parse());

cloudinary.config(
    {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    }
)

//Connect to db
const dbString = process.env.DB_STRING;


mongoose
    .connect(dbString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(
        () => {
            console.log('db is connected')
        }
    )
    .catch(
        (error) => {
            console.log('db is NOT connected. An error occured.', error)
        }
    )

//User Routes
server.use(
    '/users',
    UserRoutes
)

//Product Routes
server.use(
    '/products',
    ProductRoutes
)

//Home Page
server.get(
    '/', // http://www.apple.com/
    (req, res) => {
        res.send("<h1>Welcome to Rentz</h1>")
    }
);

//All other routes
server.get(
    '*',
    (req, res) => {
        res.send('<h1>404</h1>')
    }
);


// Connects a port number on the server
server.listen(
    process.env.PORT || 3001,
    () => {
        console.log('server is running on http://localhost:3001');
    }
);
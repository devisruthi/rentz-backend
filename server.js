// Import the main express file as a function
const express = require('express');
const mongoose = require('mongoose');

// Invoke express
const server = express();

const dbString = "mongodb+srv://admin01:db12345@cluster0.kzgjt.mongodb.net/rentz?retryWrites=true&w=majority";

mongoose
    .connect(dbString, { useNewUrlParser: true, useUnifiedTopology: true })
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


server.get(
    '/',
    (req, res) => {
        res.send("index.html")
    }
);

server.get(
    '*',
    (req, res) => {
        res.send('<h1>404</h1>')
    }
);


// Connects a port number on the server
server.listen(
    3001, 
    ()=>{
        console.log('server is running on http://localhost:3001');
    }
);
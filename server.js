// Import the main express file as a function
const express = require('express');

// Invoke express
const server = express();

server.get(
    '/',
    (req, res) => {
        res.send("<h1>Welcome to Rentz</h1>")
    }
);

server.listen(
    3001, 
    ()=>{
        console.log('server is running on http://localhost:3001');
    }
)
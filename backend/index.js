const express = require('express')
const crypto = require('crypto')
const socket = require('socket.io')
const server = require('http').createServer();

const app = express();
const io = socket(server);
/*
socket stuff
*/
io.on('connection', function(socket){
    socket.emit('hi')
})



app.get('/', (req, res) => {
    res.send('Betterguessr backend service.')
})

app.get('/join', (req, res) => {
    res.send(crypto.randomUUID())
})

app.listen(3001, () => {
    console.log('Server running on port 3001')
})

server.listen(3002, function(){
    console.log('Socket running on port 3002')
})
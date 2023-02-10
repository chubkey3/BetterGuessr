const express = require('express')
const crypto = require('crypto')
const {Server} = require('socket.io')

const data = require('./data.json')

const app = express();

const server = require('http').createServer(app);

const players = {
    "1": "Jack Hoff",
    "2": "Ben Dover"
}

const rooms = {
    "abc": {users: [], guessed: 0}
}

const getRandomLocation = () => {
    return data[Math.floor(Math.random()*data.length)]
}
/*
started: boolean,
users: guessed: boolean

*/

const io = new Server(server);
/*
socket stuff
*/
io.on("connection", (socket) => {
    
    socket.on("join", (r) => {
        const req = JSON.parse(r)

        if (!(req.room in rooms)){
            socket.emit('room_not_found', `No Room Exists with the ID: ${req.room}`)   
        } else {
            socket.join(req.room)
            
            if (!(rooms[req.room].users.includes(req.user))){
                rooms[req.room].users.push(req.user)
                io.to(req.room).emit('room', rooms[req.room].users)
            }   
        }
    })

    socket.on("start", (room) => {
        if (rooms.includes(room)){
            //rooms[room].started = true;
            io.to(room).emit('start')
            io.to(room).emit('location', getRandomLocation())
        } else {
            socket.emit('room_not_found', `No Room Exists with the ID: ${room}`)
        }
    })

    socket.on("guess", (data) => { 
        //guess is LatLng object
        const guessData = JSON.parse(data)
        //manage countdown
        console.log(guessData)
        io.to(guessData.room).emit('guess', guessData.guess)

        rooms[guessData.room].guessed = rooms[guessData.room].guessed

        if (rooms.guessData.room.guessed === rooms[guessData.room].users.length){
            io.to(guessData.room).emit('round_over')
        }
        
    })

    socket.on("new_room", () => {
        
    })
    //socket.emit('message', 'hi')
    console.log(socket.id)
    io.emit()

    socket.on('message', (msg) => {
        socket.emit('msg', msg)
    })
    //io.to('room1').emit('you are in room 1')
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

server.listen(3002, () => {
    console.log('Socket running on port 3002')
})
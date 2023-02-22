const express = require('express')
const crypto = require('crypto')
const {Server} = require('socket.io')
const mongoose = require('mongoose')
require('dotenv').config()

const data = require('./data.json')
const compression = require('compression')

const app = express();

const server = require('http').createServer(app);


const rooms = {
    "abc": {team1_guesses: [], team2_guesses: [], team1_users: [], team2_users: [], guessed: 0, team1_health: 25000, team2_health: 25000, started: false}
}

const rad = (x) => {
    return x * Math.PI / 180;
  };

var getDistance = (p1, p2) => {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat - p1.lat);
    var dLong = rad(p2.lng - p1.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;    
    return d
};


//in the future make team1_guesses/team2_guesses an array of objects so users can be associated to guesses

//replace all rooms[guessData.room] with room

function parseData(data){
    try {
        var o = JSON.parse(data)

        if (o && typeof o == Object){
            return o
        }
    }
    catch(e){}

    return data
}

const activeUsers = {}


const getRandomLocation = () => {
    return data[Math.floor(Math.random()*data.length)]
}

const roundEnd = (room) => {
    //subtract health


    if (rooms[room].team1_health <= 0){
        io.to(room).emit('win', {team: 'team2', users: rooms[room].team2_users})
        rooms[room].started = false;

    } else if (rooms[room].team2_health <= 0){
        io.to(room).emit('win', {team: 'team1', users: rooms[room].team1_users})
        rooms[room].started = false;
    
    } else {
        io.to(room).emit('round_over', {team1_guesses: rooms[room].team1_guesses, team2_guesses: rooms[room].team2_guesses, team1_health: rooms[room].team1_health, team2_health: rooms[room].team2_health, team1_distance: 1, team2_distance: 2})
        setTimeout(() => {io.to(room).emit('new_round', getRandomLocation())}, 3000)
        
    }

    rooms[room].guessed = 0;
    rooms[room].team1_guesses = [];
    rooms[room].team2_guesses = [];
        
}

const io = new Server(server);


io.on("connection", (socket) => {
    

    //testing

    /* include params later
    join - joins an existing party and returned who is in the room
    start - start game and send first location
    guess - guess for your team  


    */

    /*
    user object



    */

    //better guess detection (use array of users that have guessed)

    socket.join('abc')

    

    rooms["abc"].team1_users.push("cumstain")    
    
    io.to("abc").emit('room', {team1: rooms["abc"].team1_users, team2: rooms["abc"].team2_users})

    
    /*MOVE TO JOIN*/

    activeUsers[socket.id] = 'abc' //req.room

    socket.on("join", (r) => {
        const req = parseData(r)

        if (!(req.room in rooms)){
            socket.emit('room_not_found', `No Room Exists with the ID: ${req.room}`)   
        } else {
            socket.join(req.room)
            
            if (!(rooms[req.room].team1_users.includes(req.user))){
                rooms[req.room].team1_users.push(req.user)
                io.to(req.room).emit('room', {team1: rooms[req.room].team1_users, team2: rooms[req.room].team2_users})
            }   
        }
    })

    socket.on("switch_teams", (r) => {
        //const req = JSON.parse(r)
        const req = parseData(r)

        if (!('user' in req)){
            socket.emit('error', 'Supply a Username')
        }


        var temp = []
        if (rooms[req.room].team1_users.includes(req.user)){           
            for (var i = 0; i<rooms[req.room].team1_users.length; i++){
                if (rooms[req.room].team1_users[i] === req.user){
                    continue
                }
                temp.push(rooms[req.room].team1_users[i])
            }            

            rooms[req.room].team1_users = temp;
            rooms[req.room].team2_users.push(req.user)

        } else {
            for (var i = 0; i<rooms[req.room].team2_users.length; i++){
                if (rooms[req.room].team2_users[i] === req.user){
                    continue
                }
                temp.push(rooms[req.room].team2_users[i])
            }

            rooms[req.room].team2_users = temp;
            rooms[req.room].team1_users.push(req.user)
        }

        io.to(req.room).emit('room', {team1: rooms[req.room].team1_users, team2: rooms[req.room].team2_users})
    })

    socket.on("start", (r) => {
        const req = parseData(r)

        if (req.room in rooms){
            rooms[req.room].started = true;
            io.to(req.room).emit('new_round', getRandomLocation())
        } else {
            socket.emit('room_not_found', `No Room Exists with the ID: ${req.room}`)
        }
    })

    socket.on("guess", (r) => {         
        const req = parseData(r)
        
        if (rooms[req.room].started){            
            if (rooms[guessData.room].team1_users.includes(guessData.user)){
                rooms[guessData.room].team1_guesses.push({lat: guessData.lat, lng: guessData.lng})
            } else {
                rooms[guessData.room.team2_guesses.push({lat: guessData.lat, lng: guessData.lng})]
            }

            io.to(guessData.room).emit('guess', {lat: guessData.lat, lng: guessData.lng, user: guessData.user})

            rooms[guessData.room].guessed = rooms[guessData.room].guessed + 1

            if (rooms[guessData.room].guessed === 1){
                setTimeout(() => roundEnd(guessData.room), 1000*rooms[guessData.room].countdown_time)
            }

            else if (rooms[guessData.room].guessed === (rooms[guessData.room].team1_users.length + rooms[guessData.room].team2_users.length)){
                roundEnd(guessData.room)
            }                                    
            
        } else {
            socket.emit('game_not_started')
        }        
    })

    socket.on("new_room", () => {
      
    })


    socket.on("disconnect", () => {
        const room = activeUsers[socket.id]

        /*
        for (int i = 0; i<rooms[room].team1_users.length; i++){
            if (rooms[room].team1_users[i].socket_id === socket.id){
                delete rooms[room].team1_users[i]
                break;
            }
        }

        for (int i = 0; i<rooms[room].team2_users.length; i++){
            if (rooms[room].team2_users[i].socket_id === socket.id){
                delete rooms[room].team2_users[i]
                break;
            }
        }


        */
    })
    //io.to('room1').emit('you are in room 1')
})

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to Database!'))
    .catch(() => console.log('Could not Connected to Database!'))

//middleware
app.use(compression())
app.use(express.json())

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
const express = require('express')
const crypto = require('crypto')
const {Server} = require('socket.io')
const mongoose = require('mongoose')
const compression = require('compression')

require('dotenv').config()

const data = require('./data.json')
const Room = require('./models/Room')

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

const activeUsers = {} //convert to db?


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
        setTimeout(() => {
            let location = getRandomLocation()
            io.to(room).emit('new_round', location)
            rooms[room].location = location
        
        }, 3000)
        
    }

    rooms[room].guessed = 0;
    rooms[room].team1_guesses = [];
    rooms[room].team2_guesses = [];
        
}

const calculatePoints = (distance) => {
    if (distance > Math.pow(10, 7)){
        return 0
    }

    return (1/(2*Math.pow(10, 10))*(distance - Math.pow(10, 7))^2)
}

const calculateHealth = (room) => {
    const team1_guess = 99999999999
    const team2_guess = 99999999999
    const team1_guesses = rooms[room].team1_guesses
    const team2_guesses = rooms[room].team2_guesses

    for (let i = 0; i<team1_guesses.length; i++){
        distance = getDistance(team1_guesses[i], rooms[room].location)
        if (distance < team1_guess){
            team1_guess = distance
        }
    }

    for (let i = 0; i<team2_guesses.length; i++){
        distance = getDistance(team2_guesses[i], rooms[room].location)
        if (distance < team2_guess){
            team2_guess = distance
        }
    }

    if (team1_guess < team2_guess){
        team2_guess -= calculatePoints(team1_guess) - calculatePoints(team2_guess)
    } else if (team2_guess < team1_guess){
        team1_guess -= calculatePoints(team2_guess) - calculatePoints(team1_guess)
    }
    
}

const io = new Server(server, { cors: {
    origin: '*'
}});

console.log(activeUsers)

io.on("connection", (socket) => {

    socket.on("join", (r) => {
        const req = parseData(r)

        if (!req || !req.room || !req.user){
            socket.emit('invalid_payload')
        }
        
        else if (!(req.room in rooms)){
            socket.emit('room_not_found')   
        } 
        
        else {
            if (!(rooms[req.room].team1_users.includes(req.user))){
                socket.join(req.room)
                activeUsers[socket.id] = {room: req.room, user: req.user}
                rooms[req.room].team1_users.push(req.user)
                io.to(req.room).emit('room', {team1: rooms[req.room].team1_users, team2: rooms[req.room].team2_users})
            }   
        }

        console.log(activeUsers)

    })

    socket.on("switch_teams", (r) => {
        const req = parseData(r)

        if (!req || !req.room || !req.user){
            socket.emit('invalid_payload')
        }

        else {
            
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

        }

        
    })

    socket.on("start", (r) => {
        const req = parseData(r)

        if (req.room in rooms){
            if (rooms[req.room].started){
                room[req.room].started = true;
                
                let location = getRandomLocation()
                io.to(req.room).emit('new_round', location)
                rooms[req.room].location = location
            } else {
                socket.emit('room_started')
            }
            
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

            calculateHealth(guessData.room)

            if (rooms[guessData.room].guessed === 1){
                setTimeout(() => roundEnd(guessData.room), 1000*rooms[guessData.room].countdown_time)
            }

            else if (rooms[guessData.room].guessed === (rooms[guessData.room].team1_users.length + rooms[guessData.room].team2_users.length)){
                roundEnd(guessData.room)
            }                                    
            
        } else {
            socket.emit('room_not_started')
        }
         
        
    })

    socket.on("new_room", () => {
      
    })


    socket.on("disconnect", () => {

        if (socket.id in activeUsers){

            const room = activeUsers[socket.id].room
            const user = activeUsers[socket.id].user

            let temp = []

            for (let i = 0; i<rooms[room].team1_users.length; i++){
                if (rooms[room].team1_users[i] !== user){
                    temp.push(rooms[room].team1_users[i])
                }
            }

            rooms[room].team1_users = temp

            temp = []

            for (let i = 0; i<rooms[room].team2_users.length; i++){
                if (rooms[room].team2_users[i] !== user){
                    temp.push(rooms[room].team2_users[i])
                }
            }

            rooms[room].team2_users = temp

            delete activeUsers[socket.id]

        }
    })

})

//connect to database

/*
mongoose.connect(process.env.MONGO_URL, {dbName: 'betterguessr'})
    .then(() => console.log('Connected to Database!'))
    .catch(() => console.log('Error Connecting to Database!'))
*/

//new Room({room_name: "abc", team1_guesses: [], team2_guesses: [], room_id: crypto.randomUUID(), team1_users: [], team2_users: [], guessed: 0, started: false, team1_health: 5000, team2_health: 5000, location: {lat: 0, lng: 0}}).save()

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
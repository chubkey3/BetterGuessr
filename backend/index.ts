const express = require('express')
const { randomUUID } = require('crypto')
const {Server} = require('socket.io')
const mongoose = require('mongoose')
const compression = require('compression')

require('dotenv').config()

const data = require('./data.json')

import Room from './models/Room'

//types
import LocationData from "./types/LocationData"
import RoomData from './types/RoomData'

const app = express();

const server = require('http').createServer(app);


const rad = (x: number) => {
    return x * Math.PI / 180;
}

var getDistance = (p1: LocationData, p2: LocationData) => {    
    var R = 6378137; // Earth’s mean radius in meter    
    var dLat = rad(p2.lat - p1.lat);
    var dLong = rad(p2.lng - p1.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;    
    return d
}


//in the future make team1_guesses/team2_guesses an array of objects so users can be associated to guesses

function parseData(data: any){
    try {
        var o = JSON.parse(data)

        if (o && typeof o === 'object'){
            return o
        }
    }
    catch(e){}

    return data
}

const activeUsers: {[key: string]: {room: string, user: string}} = {} //convert to db?

const findRoom = async (room: string): Promise<RoomData> => {
    const roomData = await Room.findOne({room_name: room})

    return roomData
}

const updateRoom = async (room: string, data: any, callback?: any) => {
    Room.findOneAndUpdate({room_name: room}, data, {upsert: true}, async function(err: any) {
        if (!err && callback){
            
            await updateUsers(room)
        } else if (err) {
            console.log(err)
        }
    })    
}

const updateUsers = async (room: string) => {
    let updatedRoom = await findRoom(room)

    io.to(room).emit('room', {team1: updatedRoom.team1_users, team2: updatedRoom.team2_users})
}

const getRandomLocation = () => {
    return data[Math.floor(Math.random()*data.length)]
}

const roundEnd = async (room_name: string) => {
    //subtract health

    let room = await findRoom(room_name)    

    if (room.team1_health <= 0){
        io.to(room_name).emit('win', {team: 'team2', users: room.team2_users})
        updateRoom(room_name, {started: false})

    } else if (room.team2_health <= 0){
        io.to(room_name).emit('win', {team: 'team1', users: room.team1_users})
        updateRoom(room_name, {started: false})
    
    } else {
        io.to(room_name).emit('round_over', {team1_guesses: room.team1_guesses, team2_guesses: room.team2_guesses, team1_health: room.team1_health, team2_health: room.team2_health, team1_distance: 1, team2_distance: 2})
        setTimeout(() => {
            let location = getRandomLocation()
            io.to(room_name).emit('new_round', location)
            updateRoom(room_name, {location: location})
        
        }, 3000)
        
    }

    updateRoom(room_name, {guessed: 0, team1_guesses: [], team2_guesses: []})
        
}

const calculatePoints = (distance: number) => {
    if (distance > Math.pow(10, 7)){
        return 0
    }

    return (1/(2*Math.pow(10, 10))*(distance - Math.pow(10, 7))^2)
}

const calculateHealth = async (room_name: string) => {
    let team1_guess = 99999999999
    let team2_guess = 99999999999

    let room = await findRoom(room_name)

    const team1_guesses = room.team1_guesses
    const team2_guesses = room.team2_guesses

    let distance = 0

    for (let i = 0; i<team1_guesses.length; i++){
        distance = getDistance(team1_guesses[i], room.location)
        if (distance < team1_guess){
            team1_guess = distance
        }
    }

    for (let i = 0; i<team2_guesses.length; i++){
        distance = getDistance(team2_guesses[i], room.location)
        if (distance < team2_guess){
            team2_guess = distance
        }
    }

    if (team1_guess < team2_guess){
        updateRoom(room_name, {team2_health: Math.max(0, room.team2_health - (calculatePoints(team1_guess) - calculatePoints(team2_guess)))})
    } else if (team2_guess < team1_guess){
        updateRoom(room_name, {team1_health: Math.max(0, room.team1_health - (calculatePoints(team2_guess) - calculatePoints(team1_guess)))})
    }
    
}

const io = new Server(server, { cors: {
    origin: '*'
}});


io.on("connection", (socket: any) => {

    socket.on("join", async (r: any) => {
        const req: {room: string, user: string} = parseData(r)

        let room = await findRoom(req.room)

        if (!req.room || !req.user){
            socket.emit('invalid_payload')
        }
        
        else if (!room){
            socket.emit('room_not_found')   
        //} else if (!room.started){//switch to room.started
            //socket.emit('room_started')
        } else {
            if (!(room.team1_users.includes(req.user)) && !(room.team2_users.includes(req.user))){
                socket.join(req.room)

                activeUsers[socket.id] = {room: req.room, user: req.user}

                let team1_users = room.team1_users

                team1_users.push(req.user)

                await updateRoom(req.room, {team1_users: team1_users}, updateUsers(req.room))

            } else {
                socket.emit('user_already_joined')
            }  
        }

    })

    socket.on("switch_teams", async (r: any) => {
        const req: {user: string, room: string} = parseData(r)

        if (!req.room || !req.user){
            socket.emit('invalid_payload')
        }

        else {
            
            var temp: string[] = []

            let room = await findRoom(req.room)

            if (room.started){
                socket.emit('room_started')

            } else if (room.team1_users.includes(req.user)){           
                for (var i = 0; i<room.team1_users.length; i++){
                    if (room.team1_users[i] === req.user){
                        continue
                    }
                    temp.push(room.team1_users[i])
                }            
                
                let team2_users = room.team2_users

                team2_users.push(req.user)

                await updateRoom(req.room, {team1_users: temp, team2_users: team2_users}, updateUsers(req.room))

            } else {
                for (var i = 0; i<room.team2_users.length; i++){
                    if (room.team2_users[i] === req.user){
                        continue
                    }
                    temp.push(room.team2_users[i])
                }

                let team1_users = room.team1_users

                team1_users.push(req.user)

                await updateRoom(req.room, {team1_users: team1_users, team2_users: temp}, updateUsers(req.room))
            }
        }
    })

    socket.on("start", async (r: any) => {
        const req: {room: string} = parseData(r)

        if (!req.room){
            socket.emit('invalid_payload')
        } else {

            let room = await findRoom(req.room)

            if (room){
                if (!room.started){
                    let location = getRandomLocation()
                    
                    updateRoom(req.room, {started: true, location: location})
                                       
                    io.to(req.room).emit('new_round', location)
                } else {
                    socket.emit('room_started')
                }
                
            } else {
                socket.emit('room_not_found')
            }
        }   
    })

    socket.on("guess", async (r: any) => {         
        const req: {user: string, room: string, guess: LocationData} = parseData(r)

        let room = await findRoom(req.room)

        if (!room){
            socket.emit('room_not_found')
        } else {

            if (room.started){            

                let temp: LocationData[] = []

                if (room.team1_users.includes(req.user)){
                    temp = room.team1_guesses
                    temp.push({lat: req.guess.lat, lng: req.guess.lng})
                    updateRoom(req.room, {guessed: room.guessed + 1, team1_guesses: temp})

                } else {
                    temp = room.team2_guesses
                    temp.push({lat: req.guess.lat, lng: req.guess.lng})
                    updateRoom(req.room, {guessed: room.guessed + 1, team2_guesses: temp})
                }
    
                io.to(req.room).emit('guess', {lat: req.guess.lat, lng: req.guess.lng, user: req.user})
    
                calculateHealth(req.room)
    
                if (room.guessed === 1){
                    //setTimeout(() => roundEnd(req.room), 1000*room.countdown_time)
                    setTimeout(() => roundEnd(req.room), 1000*15)
                }
    
                else if (room.guessed === (room.team1_users.length + room.team2_users.length)){
                    roundEnd(req.room)
                }                                    
                
            } else {
                socket.emit('room_not_started')
            }
        } 
        
    })

    socket.on("new_room", () => {
      
    })


    socket.on("disconnect", async () => {

        if (socket.id in activeUsers){

            const room_name = activeUsers[socket.id].room
            const user = activeUsers[socket.id].user

            let room = await findRoom(room_name)

            let temp1: string[] = []
            let temp2: string[] = []

            for (let i = 0; i<room.team1_users.length; i++){

                if (room.team1_users[i] !== user){
                    temp1.push(room.team1_users[i])
                }
            }                   

            for (let i = 0; i<room.team2_users.length; i++){
                
                if (room.team2_users[i] !== user){
                    temp2.push(room.team2_users[i])
                }
            }            

            await updateRoom(room_name, {team1_users: temp1, team2_users: temp2}, updateUsers(room_name))

            delete activeUsers[socket.id]

        }
    })

})

//connect to database
mongoose.connect(process.env.MONGO_URL, {dbName: 'betterguessr'})
    .then(() => console.log('Connected to Database!'))
    .catch(() => console.log('Error Connecting to Database!'))

mongoose.set('strictQuery', true);

//database testing stuff
//new Room({room_name: "abc", team1_guesses: [], team2_guesses: [], room_id: crypto.randomUUID(), team1_users: [], team2_users: [], guessed: 0, started: false, team1_health: 5000, team2_health: 5000, location: {lat: 0, lng: 0}}).save()
updateRoom('abc', {team1_users: [], team2_users: [], started: false})
.then(() => {
    console.log('updated db')
})


//middleware
app.use(compression())
app.use(express.json())

app.get('/', (res: any) => {
    res.send('Betterguessr backend service.')
})

app.get('/join', (res: any) => {
    res.send(randomUUID())
})

app.listen(3001, () => {
    console.log('Server running on port 3001')
})

server.listen(3002, () => {
    console.log('Socket running on port 3002')
})
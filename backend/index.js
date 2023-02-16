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
    "abc": {team1_guesses: [], team2_guesses: [], team1_users: [], team2_users: [], guessed: 0, team1_health: 25000, team2_health: 25000, started: false}
}

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

/*
user object

id
displayName
socket_id


*/

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

        //DANGEROUS

        //check team automatically

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
        //guess is LatLng object
        const req = parseData(r)
        
        if (rooms[req.room].started){

            //manage countdown
            if (rooms[guessData.room].team1_users.includes(guessData.user)){
                rooms[guessData.room].team1_guesses.push(guessData.guess)
            } else {
                rooms[guessData.room.team2_guesses.push(guessData.guess)]
            }

            io.to(guessData.room).emit('guess', {guess: guessData.guess, team: 1, user: 'cumstain'})

            rooms[guessData.room].guessed = rooms[guessData.room].guessed + 1
            
            //parseGuesses -> distance / resulting health

            //fix below so timer instead of waiting for all users

            if (rooms[guessData.room].guessed === (rooms[guessData.room].team1_users.length + rooms[guessData.room].team2_users.length)){
                if (rooms[guessData.room].team1_health <= 0){
                    io.to(guessData.room).emit('win', {team: 'team2', users: rooms[guessData.room].team2_users})
                    rooms[guessData.room].started = false;

                } else if (rooms[guessData.room].team2_health <= 0){
                    io.to(guessData.room).emit('win', {team: 'team1', users: rooms[guessData.room].team1_users})
                    rooms[guessData.room].started = false;
                
                } else {
                    io.to(guessData.room).emit('round_over', {team1_guesses: rooms[guessData.room].team1_guesses, team2_guesses: rooms[guessData.room].team2_guesses, team1_health: rooms[guessData.room].team1_health, team2_health: rooms[guessData.room].team2_health, team1_distance: 1, team2_distance: 2})
                    setTimeout(() => {io.to(guessData.room).emit('new_round', getRandomLocation())}, 3000)
                    
                }

                rooms[guessData.room].guessed = 0;
                rooms[guessData.room].team1_guesses = [];
                rooms[guessData.room].team2_guesses = [];
                
            }
        } else {
            socket.emit('game_not_started')
        }
         
        
    })

    socket.on("new_room", () => {
      //blank template in db  
    })
    //socket.emit('message', 'hi')
    console.log(socket.id)
    io.emit()


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
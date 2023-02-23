const Guess = require('../schemas/Guess')
const UserSchema = require('../schemas/User')

const mongoose = require('mongoose')

const RoomSchema = mongoose.Schema({
    room_name: {
        type: String
    },
    team1_guesses: {
        type: [Guess]
    },
    team2_guesses: {
        type: [Guess]
    },
    room_id: {
        type: String
    },
    team1_users: {
        type: [UserSchema]
    },
    team2_users: {
        type: [UserSchema]
    },
    guessed: {
        type: Number
    },
    started: {
        type: Boolean
    },
    team1_health: {
        type: Number
    },
    team2_health: {
        type: Number
    }

})

module.exports = mongoose.model('Rooms', RoomSchema)
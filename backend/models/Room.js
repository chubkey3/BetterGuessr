import Guess from '../schemas/Guess'
import {UserSchema} from './User.js'

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

export default mongoose.model('Rooms', RoomSchema)
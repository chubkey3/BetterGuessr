const mongoose = require('mongoose')

const RoomSchema = mongoose.Schema({
    room_name: {
        type: String
    },
    team1_guesses: [
        {
            lat: {
                type: Number,
                default: 0
            },
            lng: {
                type: Number,
                default: 0
            },
            user: {
                type: String
            }
        }
    ],
    team2_guesses: [
        {
            lat: {
                type: Number,
                default: 0
            },
            lng: {
                type: Number,
                default: 0
            },
            user: {
                type: String
            }
        }
    ],
    room_id: {
        type: String
    },
    team1_users: {
        type: [String] //change to UserSchema later
    },
    team2_users: {
        type: [String]
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
    },
    location: {
        lat: {
            type: Number,
            default: 0
        },
        lng: {
            type: Number,
            default: 0
        }
    },
    countdown_time: {
        type: Number,
        default: 15
    },
    round: {
        type: Number,
        default: 1
    }
})

export default mongoose.model('Rooms', RoomSchema)
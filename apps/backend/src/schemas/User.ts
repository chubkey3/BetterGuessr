const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    username: {
        type: String
    },
    pfp: {
        type: String,
        default: '../assets/default_pfp.png'
    },
    rooms: {
        type: [String]//is this ok? probably...
    },
    id: {
        type: String
    },
    socket_id: {
        type: String
    }

})

export default UserSchema
const mongoose = require('mongoose')

const Guess = mongoose.Schema({
    lat: {
        type: Number
    },
    lng: {
        type: Number
    },
    user: {
        type: String
    }

})

export default Guess
const { Decimal128 } = require('mongoose')

const Guess = mongoose.Schema({
    lat: {
        type: Decimal128
    },
    lng: {
        type: Decimal128
    },
    user: {
        type: String
    }

})

module.exports = Guess
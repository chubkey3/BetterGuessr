const mongoose = require('mongoose')
const UserSchema = require("../schemas/User");

module.exports = mongoose.model('Users', UserSchema)
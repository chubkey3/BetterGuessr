const mongoose = require('mongoose')
const UserSchema = require('../schemas/User')

export default mongoose.model('Users', UserSchema)
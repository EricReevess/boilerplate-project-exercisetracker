const mongoose = require('mongoose')

const ENV = process.env
mongoose.connect(ENV.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Database connection successful');
    })
    .catch((err) => {
        console.error('Database connection error');
    });

const userSchema = new mongoose.Schema({
    username: String
}, { versionKey: false })

const exerciseSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
        min: [0, 'duration value must be greater than 0']
    },
    date: {
        type: Date,
        default: Date.now
    },
}, { versionKey: false })

const UserModel = mongoose.model('User', userSchema)
const ExerciseModel = mongoose.model('Exercise', exerciseSchema)

module.exports = { UserModel, ExerciseModel }
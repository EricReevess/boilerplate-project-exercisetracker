const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
dotenv.config()
const { UserModel, ExerciseModel } = require('./db')

require('dotenv').config()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const { username } = req.body
  if (!username) {
    return res.status(400).json({ code: 400, error: 'Username is required' });
  }
  UserModel.findOne({
    username
  }).then(user => {
    if (user) {
      res.json({ code: 400, error: 'user is not existed' })
      return true
    } else {
      return false
    }
  }).then(isExisted => {
    if (!isExisted) {
      const user = new UserModel({ username })
      user.save().then(user => {
        res.json(user);
      }).catch(err => {
        res.status(500).json({ code: 500, error: err })
      })
    }
  })
})

app.get('/api/users', async (req, res) => {
  const users = await UserModel.find();
  res.json(users)
})

app.use('/api/users/:_id', async (req, res, next) => {
  try {
    const { _id } = req.params;
    if (!_id) {
      return res.status(400).json({ code: 1, error: 'no user id provided' })
    }
    const user = await UserModel.findById({ _id })
    if (!user) {
      return res.status(404).json({ code: -1, error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ code: -1, error: 'Server error' });
  }
})

app.get('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { user } = req;
    const exercises = await ExerciseModel.find({ username: user.username })
    res.json(exercises)
  } catch (error) {
    res.status(500).json({ code: -1, error: 'Server error' });
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { user } = req;

    const { description, duration, date } = req.body

    if (!description) {
      return res.status(400).json({ code: 1, error: 'description is required' })
    }
    if (!duration || isNaN(duration)) {
      return res.status(400).json({ code: 1, error: 'duration is invalid' })
    }

    if (date) {
      const dateInstance = new Date(date)
      if (isNaN(dateInstance)) {
        return res.status(400).json({ code: 1, error: 'date is invalid' })
      }
    }

    const exercise = new ExerciseModel({
      username: user.username,
      description,
      duration,
      ...(date ? { date: new Date(date) } : {})
    })

    const result = await exercise.save()

    res.json({
      ...result.toObject(),
      date: result.date.toDateString(),
      _id: user._id
    })

  } catch (error) {
    return res.status(500).json({ code: 1, error: 'date is invalid' })

  }

})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { user } = req;
  const { from, to, limit } = req.query;

  let fromDate = new Date(from);
  let toDate = new Date(to);

  const query = { username: user.username }

  if (!isNaN(fromDate)) {
    query.date = { ...query.date, $gte: fromDate }
  }

  if (!isNaN(toDate)) {
    query.date = { ...query.date, $lte: toDate }
  }

  let exercises = await ExerciseModel.find(query)

  if (limit && !isNaN(limit)) {
    exercises = exercises.slice(0, limit)
  }

  const result = {
    ...user.toObject(),
    count: exercises.length,
    log: exercises.map((item) => ({ ...item.toObject(), date: item.date.toDateString() })),
  }

  res.json(result)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

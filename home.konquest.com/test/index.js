var dotenv = require('dotenv')
dotenv.load()

var db = require('database')

describe('Home', function () {
  before(function (next) {
    db.sequelize.sync()
      .then(function () {
        next()
      })
  })

  require('./util')
  require('./server')
})

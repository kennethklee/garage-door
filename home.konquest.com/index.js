var dotenv = require('dotenv')
dotenv.load()

var Server = require('server')
var db = require('database')

var server = new Server()

db.sequelize.sync()
  .then(function () {
    server.listen(process.env.PORT, function () {
      console.log('Started %s server on port %d', server.get('env'), process.env.PORT)
    })
  })

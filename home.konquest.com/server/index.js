var compression = require('compression')
var bodyParser = require('body-parser')
var express = require('express')
var helmet = require('helmet')
var cors = require('cors')

var express = require('express')
var routes = require('./routes')
var errorHandler = require('./middleware/error-handler')


var Server = function() {
  var app = express()

  app.set('x-powered-by', false)
  app.use(compression())
  app.use(helmet.xframe())
  app.use(helmet.nosniff())
  app.use(cors())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(bodyParser.json())

  routes(app)

  app.use(errorHandler)

  return app
}


module.exports = Server

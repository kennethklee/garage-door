var compression = require('compression')
var bodyParser = require('body-parser')
var express = require('express')
var helmet = require('helmet')
var cors = require('cors')

var express = require('express')
var routes = require('./routes')


var Server = function() {
  var app = express()

  app.set('x-powered-by', false)
  app.use(compression())
  app.use(helmet.xframe())
  app.use(helmet.nosniff())
  app.use(cors())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))

  routes(app)

  return app
}


module.exports = Server

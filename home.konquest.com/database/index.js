var Sequelize = require('sequelize')

// Connect to DB
var sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'sqlite',
  host: process.env.DB_HOST,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  logging: (process.env.NODE_ENV === 'development') && console.log
})

var db = {
	sequelize: sequelize
}

var fs = require('fs')
var path = require('path')

// Initialize each model into db object
fs.readdirSync(path.join(__dirname, 'models'))
  .forEach(function (file) {
  	// Capitalize name
    var modelName = file.replace(/(?:^|\W)\w/g, function (str) {
      return str.toUpperCase()
    })
    modelName = modelName.replace(/-|\.js$/gi, '')

    db[modelName] = sequelize.import(path.join(__dirname, 'models', file))
  })

module.exports = db

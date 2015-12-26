var doors = require('./doors')

module.exports = function (app) {
  app.use('/doors', doors)
}

var express = require('express')

var db = require('database')
var Controller = require('util/controller')

var router = module.exports = express.Router()

var doorController = new Controller({
  model: db.Door,
  key: 'door'
})

// Parse ID
router.param('door', doorController.param.bind(doorController))

router.route('/')
  .get(doorController.list.bind(doorController))
  .post(doorController.create.bind(doorController))

router.route('/:door')
  .get(doorController.show.bind(doorController))
  .put(doorController.update.bind(doorController))
  .delete(doorController.delete.bind(doorController))

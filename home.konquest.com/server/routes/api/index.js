var express = require('express')

var db = require('database')

var router = module.exports = express.Router()

router.use('/doors', require('./doors'))

var isUUID = require('util/uuid').isUUID
var ValidationError = require('sequelize').ValidationError

var routify = function (method, obj) {
  obj[method] = obj[method].bind(obj)
}

/**
  Creates basic controllers
*/
var Controller = module.exports = function (options) {
  var opts = options || {}
  opts.list = opts.list || {}
  opts.create = opts.create || {}
  opts.show = opts.show || {}
  opts.update = opts.update || {}
  opts.delete = opts.delete || {}
  opts.errorLogger = opts.errorLogger || console.error

  // Validation
  if (!opts.model) {
    throw new Error('Missing model paramter.')
  }
  if (!opts.key) {
    throw new Error('Missing key paramter.')
  }

  // Default handlers
  opts.list.onSuccess = function (records, req, res, next) {
    var response = records.map(function (record) {
      return record.toJson()
    })
    res.send(response)
  }
  opts.create.onSuccess = function (record, req, res, next) {
    res
      .status(201)
      .send(record.toJson())
  }
  opts.delete.onSuccess = function (record, req, res, next) {
    res
      .status(200)
      .end()
  }
  opts.onError = function (err, req, res, next) {
    var response = {
      code: err.code,
      message: err.message
    }

    if (err instanceof ValidationError) {
      res.status(400)
      response.errors = err.errors
    } else {
      this.options.errorLogger(err.stack)
    }

    res.send(response)
  }.bind(this)
  opts.onSuccess = function (record, req, res, next) {
    res.send(record.toJson())
  }

  this.options = opts

  // Change functions to be able to be routed in express
  routify('param', this)
  routify('create', this)
  routify('show', this)
  routify('update', this)
  routify('delete', this)
}

Controller.prototype.param = function (req, res, next, id) {
  var where = {}
  if (isUUID(id)) {
    where.id = id
  } else {
    where.slug = id
  }

  var self = this
  this.options.model.findOne({ where: where })
    .then(function (record) {
      res.locals[self.options.key] = record
      next()
    }).catch(next)
}

Controller.prototype.list = function (req, res, next) {
  // TODO better querying (pagination, fields)
  var self = this
  this.options.model.findAll()
    .then(function (records) {
      if (self.options.list.onSuccess) {
        self.options.list.onSuccess(records, req, res, next)
      } else {
        self.options.onSuccess(records, req, res, next)
      }
    })
    .catch(function (err) {
      if (self.options.list.onError) {
        self.options.list.onError(records, req, res, next)
      } else {
        self.options.onError(records, req, res, next)
      }
    })
}

Controller.prototype.create = function (req, res, next) {
  var self = this
  this.options.model.create(req.body)
    .then(function (records) {
      if (self.options.create.onSuccess) {
        self.options.create.onSuccess(records, req, res, next)
      } else {
        self.options.onSuccess(records, req, res, next)
      }
    })
    .catch(function (err) {
      if (self.options.create.onError) {
        self.options.create.onError(err, req, res, next)
      } else {
        self.options.onError(err, req, res, next)
      }
    })
}

Controller.prototype.show = function (req, res, next) {
  if (!res.locals[this.options.key]) {
    return next()
  }

  if (this.options.show.onSuccess) {
    this.options.show.onSuccess(res.locals[this.options.key], req, res, next)
  } else {
    this.options.onSuccess(res.locals[this.options.key], req, res, next)
  }
}

Controller.prototype.update = function (req, res, next) {
  if (!res.locals[this.options.key]) {
    return next()
  }

  var self = this
  res.locals[this.options.key].update(req.body, {limit: 1})
    .then(function (record) {
      if (self.options.update.onSuccess) {
        self.options.update.onSuccess(record, req, res, next)
      } else {
        self.options.onSuccess(record, req, res, next)
      }
    })
    .catch(function (err) {
      if (self.options.update.onError) {
        self.options.update.onError(err, req, res, next)
      } else {
        self.options.onError(err, req, res, next)
      }
    })
}

Controller.prototype.delete = function (req, res, next) {
  if (!res.locals[this.options.key]) {
    return next()
  }

  var self = this
  res.locals[this.options.key].destroy()
    .then(function (record) {
      if (self.options.delete.onSuccess) {
        self.options.delete.onSuccess(record, req, res, next)
      } else {
        self.options.onSuccess(record, req, res, next)
      }
    })
    .catch(function (err) {
      if (self.options.delete.onError) {
        self.options.delete.onError(err, req, res, next)
      } else {
        self.options.onError(err, req, res, next)
      }
    })
}

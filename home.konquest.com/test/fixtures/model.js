var Model = module.exports = function (options) {
  var opts = options || {}
  this.error = !!opts.error
  this.result = opts.result

  var model = this
  this.result.update = function () {
    model.lastCall = 'update'
    return new Promise(function (resolve, reject) {
      (model.error ? reject : resolve)(model.result)
    })
  }
  this.result.destroy = function () {
    model.lastCall = 'destroy'
    return new Promise(function (resolve, reject) {
      (model.error ? reject : resolve)(model.result)
    })
  }
}

Model.prototype = ['findAll', 'findOne', 'create', 'update', 'destroy'].reduce(function (proto, method) {
  proto[method] = function () {
    var self = this
    this.lastCall = method
    return new Promise(function (resolve, reject) {
      (self.error ? reject : resolve)(self.result)
    })
  }
  return proto
}, {})

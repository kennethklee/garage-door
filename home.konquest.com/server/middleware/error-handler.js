module.exports = function (err, req, res, next) {
  err.status = err.status || 500

  if (err.status >= 500) {
    console.error(err.stack)
  }

  res
    .status(err.status)
    .send({
      code: err.code,
      message: err.message
    })
}

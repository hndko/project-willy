// Catch error that occur in asynchronus by route handlers or middleware
const asyncHandle = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandle;

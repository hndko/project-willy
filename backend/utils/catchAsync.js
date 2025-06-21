/**
 * Wraps an async function to catch errors and pass them to the error middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
module.exports = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler
exports.notFound = (req, res, next) => {
  const error = new Error(`Tidak Ditemukan = ${req.originalUrl}`);
  res.status(404);
  next(error);
};

exports.errorHandler = (err, req, res, next) => {
  // Jika status code tidak dimasukan di error handlernya
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode; //jika dia merespon status 200 kita ubah jadi 500 dan tapi jika dia tidah 200 maka res.statusCodenya yg kita dapatkan

  let message = err.message; // mendapatkan error messagenya

  // Handle Sequelize validation errors
  if (err.errors || err.name == "SequelizeValidationError") {
    const errorList = err.errors.map((err) => {
      let obj = {};
      obj[err.path] = err.message;
      return obj;
    });
    message = errorList;
    statusCode = 400;
  }

  // Handle Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    message = "Ada data yang sudah terdaftar di sistem";
    statusCode = 400;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack, // hanya tampilkan stack error di development
  });
};

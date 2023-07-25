const express = require('express');

const AppError = require('./utils/appError');
const globalErrorHanderer = require('./controllers/errorController');
const tourRoute = require('./routes/tourRoutes');
const userRoute = require('./routes/userRoutes');

const app = express();

// -------------------- Middlewares --------------------

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRoute);
app.use('/api/v1/users', userRoute);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

app.use(globalErrorHanderer);

module.exports = app;

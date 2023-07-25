/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
const dotEnv = require('dotenv');
const fs = require('fs');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Tour = require('./model/tourModel');

dotEnv.config({ path: './config.env' });

const app = require('./app');

// ----------------- GLOBAL UNHANDELED REJECTION HANDLINGS ------------------------

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 🔥 Shutting down...');
  console.log(err);
  process.exit(1);
});

// ----------------- HANDLINGS UNCAUGHT EXCEPTIONS ------------------------

process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION! 🔥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB Connected');
  })
  .catch((err) => console.log(err));

// ---------------------- server ----------------------

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server connected Port ${port}...`);
});

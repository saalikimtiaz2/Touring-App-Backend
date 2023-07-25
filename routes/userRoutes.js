const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const { signup, login, forgetPassword, resetPassword } = authController;

const { getAllUsers, getUser, updateUser, addUser, deleteUser } =
  userController;

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/forgotPassword', forgetPassword);
router.patch('/resetPassaword/:token', resetPassword);

router.route('/').get(getAllUsers).post(addUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

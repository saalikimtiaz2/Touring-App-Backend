const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});
exports.addUser = (req, res) => {
  res.end('addUser Router not Defined');
};
exports.checkId = (req, res, next, val) => {
  next();
};
exports.getUser = (req, res) => {
  res.end('getUser Router not Defined');
};
exports.updateUser = (req, res) => {
  res.end('updateUser Router not Defined');
};
exports.deleteUser = (req, res) => {
  res.end('deleteUser Router not Defined');
};

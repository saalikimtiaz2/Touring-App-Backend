const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// Method => POST
// Route => /users/signup
//  Description =>  Authenticate new user
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: { user: newUser },
  });
});

// Method => POST
// Route => /users/login
//  Description =>  Authenticate new user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if the email/password exists
  if (!email || !password) {
    return next(new AppError('Please provide an email and password', 400));
  }

  // 2) Check if the user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything is Okay, send token to client
  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
  });
});

// -----------------------MIDDLEWARE FUNCTIONS------------------------
exports.protect = catchAsync(async (req, res, next) => {
  // 1) get and check token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access', 401)
    );
  }

  // 2) verify token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
    () => {}
  );

  // 3) check if user is exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return new AppError('The user is no longer exist', 401);
  }

  // 4) check if user changed password after token issue
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return new AppError(
      'Usser recently changed password please login again',
      401
    );
  }

  // 5) GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Your don't have permission to access this route", 403)
      );
    }
    next();
  };

// Method => POST
// Route => /users/forgotPassword
//  Description =>  send Link to reset password
exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2) Generate a random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request to reset your password to: ${resetURL} \n if you don't want to reset your password, please ignore this this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Forgot your password',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }
});

// Method => PATCH
// Route => /users/resetPassword/:token
//  Description =>  change the password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwrodResetExpires: { $gt: Date.now() },
  });
  console.log(user, hashedToken);

  // 2) Check if token is not expired and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 404));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwrodResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();

  // 3) Update changePassowrdAt property for the current user
  // 4) Login the user, send JWT
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

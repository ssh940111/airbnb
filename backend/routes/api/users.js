const express = require('express');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email.'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.'),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage("First Name is required"),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage("Last Name is required"),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors
];

// Sign up
router.post(
  '/',
  // validateSignup,
  async (req, res) => {
    const { firstName, lastName, email, password, username } = req.body;

    const invalidEmail = await User.findOne({
      where: { email }
    });

    if (invalidEmail) {
      res.status(403);
      return res.json({
        message: "User already exists",
        statusCode: 403,
        errors: {
          email: "User with that email already exists"
        }
      })
    };

    const invalidUserName = await User.findOne({
      where: { username }
    });

    if (invalidUserName) {
      res.status(403);
      return res.json({
        message: "User already exists",
        statusCode: 403,
        errors: {
          username: "User with that username already exists"
        }
      })
    };

    const validationErr = {
      message: "Validation Error",
      statusCode: 400,
      errors: {},
    }

    if (!email) validationErr.errors.email = "Invalid email";
    if (!username) validationErr.errors.username = "Username is required";
    if (!firstName) validationErr.errors.firstName = "First Name is required";
    if (!lastName) validationErr.errors.lastName = "Last Name is required";

    if (!email || !username || !firstName || !lastName) {
      res.status(400);
      return res.json(validationErr)
    }


    const user = await User.signup({ email, username, password, firstName, lastName });

    let token = await setTokenCookie(res, user);

    const newUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      token: token,
    };

    return res.json(newUser)
  }
);


module.exports = router;

require("dotenv").config();
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../utils/database");
const redisClient = require('../databases/redis')

exports.signup = (req, res, next) => {
  // console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  // res.json('aaa')
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const dateOfBirth = req.body.dateOfBirth;
  const phone = req.body.phone;
  const isAdmin = req.body.isAdmin;

  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      //create here
      return db.query(
        "INSERT INTO USER (email, password, name, dateOfBirth, phone, isAdmin) values (?, ?, ?, ?, ?, ?)",
        [email, hashedPw, name, dateOfBirth, phone, isAdmin],
        (err, result) => {
          if (err) {
            console.log(err);
            next(err);
          }
          console.log(result);
        }
      );
    })
    .then((result) => {
      res.status(201).json({ message: "User created!." });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  db.query("SELECT * FROM USER WHERE email = ?", [email])
    .then(([body, meta]) => {
      if (!body[0]) {
        const error = new Error("A user with this email could not be found!");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = body[0];
      // console.log(loadedUser);
      return bcrypt.compare(password, body[0].password);
    })
    .then(async (isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser.userId,
          isAdmin: loadedUser.isAdmin,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser.userId,
          isAdmin: loadedUser.isAdmin,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "30d",
        }
      );

      await redisClient.set(loadedUser.email, refreshToken, {
        EX: 365 * 24 * 60 * 60,
      });

      res.status(200).json({
        accessToken: token,
        refreshToken: refreshToken,
        userId: loadedUser.userId,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.refreshTokenController = (req, res, next) => {
  const refreshToken = req.body.token;

  const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  const token = jwt.sign(
    {
      email: user.email,
      userId: user.userId,
      isAdmin: user.isAdmin,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );

  const newRefreshToken = jwt.sign(
    {
      email: user.email,
      userId: user.userId,
      isAdmin: user.isAdmin,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "30d",
    }
  );

  res.status(200).json({
    accessToken: token,
    refreshToken: newRefreshToken,
    userId: user.userId,
  });

  console.log(user);

  // res.status(200).json({ a: "a" });
};

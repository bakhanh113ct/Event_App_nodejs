const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const db = require("../utils/database");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return db
          .execute("SELECT * FROM USER WHERE email = ?", [value])
          .then((result) => {
            if (result[0].length != 0)
              return Promise.reject("E-Mail address already exists!");
          });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);

router.post("/refreshToken", authController.refreshTokenController);

module.exports = router;

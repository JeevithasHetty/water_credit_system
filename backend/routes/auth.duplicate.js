const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// ✅ make sure these exist in authController.js: exports.signup, exports.login
router.post("/signup", authController.signup);
router.post("/login", authController.login);

module.exports = router;

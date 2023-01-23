const express = require("express");
const userMiddleware = require("../middlewares/user");
const upload = require("../middlewares/uploads");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateSubscription,
  updateAvatar,
  verifyToken,
  verifyEmail,
} = require("./controllers");

const router = express.Router();

router.get("/login", loginUser);
router.post("/signup", registerUser);
router.post("/logout", userMiddleware, logoutUser);

router.get("/verify/:verificationToken", verifyToken);
router.post("/verify", verifyEmail);

router.get("/current", userMiddleware, getCurrentUser);
router.patch("/", userMiddleware, updateSubscription);

router.patch("/avatars", userMiddleware, upload.single("avatar"), updateAvatar);

module.exports = router;

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
} = require("./controllers");

const router = express.Router();

router.get("/login", loginUser);
router.post("/signup", registerUser);
router.post("/logout", userMiddleware, logoutUser);

router.get("/current", userMiddleware, getCurrentUser);
router.patch("/", userMiddleware, updateSubscription);

router.patch("/avatars", userMiddleware, upload.single("avatar"), updateAvatar);

module.exports = router;

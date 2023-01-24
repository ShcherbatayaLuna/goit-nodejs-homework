const fs = require("fs").promises;
const UserSchema = require("./schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");
// const nodemailer = require("nodemailer");
// const { verificationLetter } = require("./nodemailer");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const registerUser = async (req, res) => {
  const user = req.body;
  user.password = await bcrypt.hash(user.password, 10);
  user.avatarURL = gravatar.url(user.email);
  user.verificationToken = await nanoid();
  // const user = await UserSchema.findOneAndUpdate(
  //   { email },
  //   {
  //     password: await bcrypt.hash(password, 10),
  //     avatarURL: gravatar.url(email),
  //     verificationToken: await nanoid(),
  //   },
  //   { upsert: true }
  // );
  try {
    const { email, verificationToken } = await UserSchema.findOneAndUpdate(
      user
    );

    const msg = {
      to: email,
      from: process.env.EMAIL,
      subject: "Verification Token",
      text: `Please confirm your email. Send GET request to http://localhost:3000/users/verify/${verificationToken}`,
      html: `<a href="http://localhost:3000/users/verify/${verificationToken}">Please confirm your email</a>`,
    };

    await sgMail.send(msg);

    res.status(201).json({ message: "User successfully registered" }).end();
  } catch (error) {
    if (user) {
      res.status(409).json({ message: "Email in use" });
      return;
    }

    if (!email) {
      res.status(400).json({ message: "missing required field email" });
      return;
    }
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await UserSchema.findOne({ email });
  if (!user) {
    res.status(400).json({ message: "Email or password is wrong" });
    return;
  }
  const validPassword = bcrypt.compare(password, user.password);
  if (!validPassword) {
    res.status(401).json({ message: "Email or password is wrong" });
    return;
  }
  const token = jwt.sign({ id: user._id }, process.env.SECRET_TOKEN);
  const data = await UserSchema.findOneAndUpdate(
    { email },
    { $set: { token } },
    { new: true }
  );
  res
    .status(200)
    .json({
      token: data.token,
      email,
      subscription: data.subscription,
      id: user._id,
    })
    .end();
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json(req.user);
};

const logoutUser = async (req, res) => {
  const { _id } = req.user;
  await UserSchema.findByIdAndUpdate(
    _id,
    { $set: { token: null } },
    { new: true }
  );
  res.status(204).end();
};

const updateSubscription = async (req, res) => {
  const { _id } = req.user;
  const { subscription } = req.body;

  await UserSchema.findByIdAndUpdate(_id, {
    $set: { subscription },
  });
  res.status(200).json({ subscription }).end();
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path } = req.file;

  const avatar = await Jimp.read(path);
  avatar.cover(250, 250).write(`public/avatars/${_id}`);
  await fs.unlink(path);
  await UserSchema.findByIdAndUpdate(_id, {
    avatarURL: `/avatars/${_id}`,
  });

  res
    .status(200)
    .json({ avatarURL: `/avatars/${_id}` })
    .end();
};

const verifyToken = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await UserSchema.findOneAndUpdate(
    { verificationToken: verificationToken, verify: false },
    { verificationToken: null, verify: true },
    { new: true }
  );

  if (user) {
    res.status(200).json({
      message: "Verification successful",
    });
    return;
  }
  res.status(404).json({
    message: "User not found",
  });
};

const verifyEmail = async (req, res) => {
  const email = req.body;
  if (!email) {
    res.status(400).json({
      message: "missing required field email",
    });
    return;
  }

  const { verify, verificationToken } = await UserSchema.findOne({
    email,
  });

  if (!verify) {
    const msg = {
      to: email,
      from: process.env.EMAIL,
      subject: "Verification Token",
      text: `Please confirm your email. Send GET request to http://localhost:3000/users/verify/${verificationToken}`,
      html: `<a href="http://localhost:3000/users/verify/${verificationToken}">Please confirm your email</a>`,
    };

    await sgMail.send(msg);

    res.status(200).json({
      message: "Verification email sent",
    });
    return;
  }

  res
    .status(400)
    .json({
      message: "Verification has already been passed",
    })
    .end();
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateSubscription,
  updateAvatar,
  verifyToken,
  verifyEmail,
};

const nodemailer = require("nodemailer");

require("dotenv").config();

const config = {
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
};

const transporter = nodemailer.createTransport(config);

const verificationLetter = async (data) => {
  const email = { ...data, from: process.env.EMAIL };
  await transporter.sendMail(email);
  return true;
};

module.exports = { verificationLetter };

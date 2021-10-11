const express = require("express");
const User = require("../models/userschema");
const nodemailer = require("nodemailer");
const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const router = express.Router();
// set up
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADRESS,
    pass: process.env.EMAIL_PASSWORD, //
  },
});
router.put("/forgetEmail", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        error:
          "email does not exist. please make sure it's the  correcte email adress .",
      });
    }
    const email = user.email;
    const token = jwt.sign({ _Id: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
    const name = user.pseudo;
    // 1. read template path
    const templatePath = path.resolve(
      "./Api/mail-template",
      "email-template.html"
    );

    // // 2. read template content
    const content = fs.readFileSync(templatePath, { encoding: "utf-8" });

    // const info = await transporter.sendMail(mailData);
    // user.resetlink = token;
    // await user.save();
    // res.send({ message: "check your Mail", message_id: info.messageId });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ADRESS,
        pass: process.env.EMAIL_PASSWORD, //
      },
    });

    // send mail with text
    const mailtext = await transporter.sendMail({
      from: process.env.EMAIL_ADRESS, // sender address
      to: user.email, // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello SHinigami again ", // plain text body
      html: ejs.render(content, { token, name, email }),
    });
    res.status(200).json("email has been sent .");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/resetpassword", async (req, res) => {
  const resetlink = req.body.resetLink;
  const newPass = req.body.password;

  try {
    if (resetlink) {
      jwt.verify(
        resetlink,
        process.env.JWT_SECRET,
        async (err, decodedData) => {
          console.log(decodedData);
          if (err) {
            res
              .status(400)
              .json({ message: "invalid token , please try again " });
          }
          const hashedPwd = await bcrypt.hash(newPass, 10);

          const user = await User.findOneAndUpdate(
            { email : decodedData._Id },
            {
              password: hashedPwd,
            }
          );
          console.log(user);
          res.status(200).json({ message: "your password has been changed" });
        }
      );
    } else {
      res.status(400).json({ message: "reset link is expired" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server error Occured" });
  }
});

module.exports = router;
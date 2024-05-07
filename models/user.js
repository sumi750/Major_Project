const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportlocal = require("passport-local-mongoose");

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },

    email : {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

// User.plugin(passportlocal);
module.exports = mongoose.model("User", userSchema);
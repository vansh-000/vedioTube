import mongoose, { Schema } from 'mongoose';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// pre is a middleware function that runs before any method
// HERE WE ARE RUNNING IT BEFORE SAVE
userSchema.pre('save', async function (next) {
    // if passwoard is not changed ie. other fields are changed just go to next step
    if (!this.isModified('password')) return next();
    // else encrypt the password
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// makeing a new method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAcessToken = function () {
    // jwt .sign(payload, secret, options, callback)
    return jwt.sign(
        {
            _id: this._id,
            // NO NEED TO HAVE THESE FIELDS
            // email: this.email,
            // username: this.username,
            // fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model('User', userSchema);

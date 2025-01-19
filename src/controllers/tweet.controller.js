import mongoose, { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createTweet = asyncHandler(async (req, res) => {
    // get content from request body
    const { content } = req.body;

    // check if content is empty
    if (!content.trim()) {
        throw new ApiError(400, 'Content is required');
    }

    // get user from request
    const user = req.user;

    // create tweet
    const tweet = await Tweet.create({
        content,
        owner: user._id,
    });

    // return tweet
    return res.status(201).json(new ApiResponse(201, 'Tweet created', tweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // get user id from request params
    const { userId } = req.params;

    // validate user id
    const isValid = isValidObjectId(userId);
    if (!isValid) {
        throw new ApiError(400, 'Invalid user ID');
    }

    // get user from database
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // get tweets by user
    const tweets = await Tweet.find({ owner: userId });

    // check if tweets exist
    if (tweets.length === 0) {
        throw new ApiError(404, 'No tweets found');
    }

    // return tweets
    return res.status(200).json(new ApiResponse(200, 'User tweets', tweets));
});

const updateTweet = asyncHandler(async (req, res) => {
    // get tweet id from params
    const { tweetId } = req.params;
    const isValid = isValidObjectId(tweetId);
    if (!isValid) {
        throw new ApiError(400, 'Invalid tweet ID');
    }
    // get tweet from database
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, 'Tweet not found');
    }
    // get user from request
    const user = req.user;
    if (tweet.owner.toString() !== user._id.toString()) {
        throw new ApiError(403, 'You are unauthorized to update this tweet');
    }
    // get content from request body
    const { content } = req.body;

    // check if content is empty
    if (!content.trim()) {
        throw new ApiError(400, 'Content is required');
    }

    // update tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content },
        { new: true }
    );
    return res
        .status(200)
        .json(new ApiResponse(200, 'Tweet updated', updatedTweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
    // get tweet id from params
    const { tweetId } = req.params;
    const isValid = isValidObjectId(tweetId);
    if (!isValid) {
        throw new ApiError(400, 'Invalid tweet ID');
    }
    // get tweet from database
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, 'Tweet not found');
    }
    // get user from request
    const user = req.user;
    if (tweet.owner.toString() !== user._id.toString()) {
        throw new ApiError(403, 'You are unauthorized to delete this tweet');
    }
    // delete tweet
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    return res
        .status(200)
        .json(new ApiResponse(200, 'Tweet deleted', deletedTweet));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

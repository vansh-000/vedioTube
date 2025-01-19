import mongoose, { isValidObjectId } from 'mongoose';
import { User } from '../models/user.model.js';
import { Subscription } from '../models/subscription.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // get user id from req.user
    const userId = req.user._id;

    // check if channel exists
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel id');
    }

    // check if channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, 'Channel not found');
    }

    // check if user is already subscribed to channel
    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    if (subscription) {
        // if subscribed, then unsubscribe
        await Subscription.findByIdAndDelete(subscription._id);
    } else {
        // if not subscribed, then subscribe
        await Subscription.create({ subscriber: userId, channel: channelId });
    }

    // return success response
    return res.status(200).json(new ApiResponse(200, 'Success'));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // check if channel exists
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel id');
    }

    // check if channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, 'Channel not found');
    }

    // get subscriber list and aggregate to find user details
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriber',
            },
        },
        {
            $unwind: '$subscriber',
        },
        {
            $project: {
                username: '$subscriber.username',
                fullname: '$subscriber.fullname',
                avatar: '$subscriber.avatar',
            },
        },
    ]);

    // no subscribers
    if (subscribers.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, 'No subscribers are found'));
    }

    // return subscriber list
    return res.status(200).json(new ApiResponse(200, subscribers));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // check if user exists
    const user = await User.findById(subscriberId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // check id Id is valid
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, 'Invalid user id');
    }

    // get subscribed channel list and aggregate to find channel details
    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: '_id',
                as: 'channel',
            },
        },
        {
            $unwind: '$channel',
        },
        {
            $project: {
                username: '$channel.username',
                fullname: '$channel.fullname',
                avatar: '$channel.avatar',
            },
        },
    ]);

    // no subscribed channels
    if (channels.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, 'No subscribed channels are found'));
    }

    // return channel list
    return res.status(200).json(new ApiResponse(200, channels));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

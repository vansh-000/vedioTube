import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.model.js';
import { Subscription } from '../models/subscription.model.js';
import { Like } from '../models/like.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getChannelStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        throw new ApiError('Invalid channel id', 400);
    }

    // Find the total number of videos for the channel
    const totalVideos = await Video.countDocuments({ owner: userId });

    // Find the total number of views for the channel's videos
    const totalViews = await Video.aggregate([
        { $match: { owner: userId } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' },
            },
        },
    ]);

    // Pre-fetch the video, comment, and tweet IDs for the channel
    const videoIds = await Video.find({ owner: userId }).select('_id');
    const commentIds = await Comment.find({ owner: userId }).select('_id');
    const tweetIds = await Tweet.find({ owner: userId }).select('_id');

    // Total number of likes for the channel's content (video, comment, tweet)
    const totalLikes = await Like.aggregate([
        {
            $match: {
                $or: [
                    { video: { $in: videoIds } },
                    { comment: { $in: commentIds } },
                    { tweet: { $in: tweetIds } },
                ],
            },
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 },
            },
        },
    ]);

    // Find the total number of subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: userId,
    });

    // Return the stats
    res.json(
        new ApiResponse('Channel stats', 200, {
            totalVideos,
            totalViews: totalViews[0] ? totalViews[0].totalViews : 0,
            totalSubscribers,
            totalLikes: totalLikes[0] ? totalLikes[0].totalLikes : 0,
        })
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // Get the channel id from the request

    const { channelId } = req.params;

    // Check the validity of the channelId

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError('Invalid channel id', 400);
    }

    // Find thevideos of that user using aggregated pipeline

    const videos = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerInfo',
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                views: 1,
                createdAt: 1,
                owner: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                },
            },
        },
    ]);

    // check if videos are present or not
    if (videos.length === 0) {
        throw new ApiError('No videos found', 404);
    }
    // return the videos
    res.json(new ApiResponse('Channel videos', 200, videos));
});

export { getChannelStats, getChannelVideos };

import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const user = req.user; // User from request
    const { tweetId } = req.params; // Tweet ID from params

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid tweet ID');
    }

    // Ensure user exists
    if (!user) {
        throw new ApiError(401, 'User is unauthorized');
    }

    // Check if the tweet exists
    const tweetExists = await Tweet.findById(tweetId);
    if (!tweetExists) {
        throw new ApiError(404, 'Tweet not found');
    }

    // Toggle like atomically
    const existingLike = await Like.findOne({
        likedBy: user._id,
        tweet: tweetId,
    });

    if (existingLike) {
        await Like.findOneAndDelete({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, { liked: false, message: 'Like removed' }));
    } else {
        await Like.create({
            likedBy: user._id,
            tweet: tweetId,
        });
        return res.status(201).json(new ApiResponse(201, { liked: true, message: 'Like created' }));
    }
});


const getLikedVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user id');
    }

    // Aggregate liked videos with video and owner details
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: mongoose.Types.ObjectId(userId),
                video: { $exists: true },
            },
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'videoDetails',
            },
        }, // nested lookup inside pipeline is not allowed so we need to unwind it
        {
            $unwind: '$videoDetails',
        },
        {
            $lookup: {
                from: 'users',
                localField: 'videoDetails.owner',
                foreignField: '_id',
                as: 'videoOwner',
            },
        },
        {
            $unwind: '$videoOwner',
        },
        {
            $project: {
                _id: 1,
                video: '$videoDetails._id',
                videoTitle: '$videoDetails.title',
                videoDescription: '$videoDetails.description',
                createdAt: '$videoDetails.createdAt',
                owner: {
                    username: '$videoOwner.username',
                    fullname: '$videoOwner.fullname',
                    avatar: '$videoOwner.avatar',
                },
            },
        },
    ]);

    // Return the liked videos
    return res.status(200).json(new ApiResponse(200, likedVideos));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.model.js';
import { Video } from '../models/video.model.js';
import { Comment } from '../models/comment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
    // Get videoId from request params
    const { videoId } = req.params;

    // Get user from request
    const user = req.user;

    // Validate videoId
    const videoIdValid = isValidObjectId(videoId);
    if (!videoIdValid) {
        throw new ApiError(400, 'Invalid video ID');
    }

    // Check if the video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, 'Video not found');
    }

    // Toggle like atomically
    const existingLike = await Like.findOne({
        likedBy: user._id,
        video: videoId,
    });
    if (existingLike) {
        await Like.findOneAndDelete({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, 'Video unliked'));
    }

    // Create a new like
    await Like.create({
        likedBy: user._id,
        video: videoId,
    });
    return res.status(201).json(new ApiResponse(201, 'Video liked'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const user = req.user; // User from request
    const { commentId } = req.params; // Comment ID from params

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID');
    }

    // Check if the comment exists
    const commentExists = await Comment.findById(commentId);
    if (!commentExists) {
        throw new ApiError(404, 'Comment not found');
    }

    // Toggle like atomically
    const existingLike = await Like.findOne({
        likedBy: user._id,
        comment: commentId,
    });

    if (existingLike) {
        await Like.findOneAndDelete({ _id: existingLike._id });
        return res
            .status(200)
            .json(
                new ApiResponse(200, { liked: false, message: 'Like removed' })
            );
    } else {
        await Like.create({
            likedBy: user._id,
            comment: commentId,
        });
        return res
            .status(201)
            .json(
                new ApiResponse(201, { liked: true, message: 'Like created' })
            );
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const user = req.user; // User from request
    const { tweetId } = req.params; // Tweet ID from params

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid tweet ID');
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
        // Remove like
        await Like.findOneAndDelete({ _id: existingLike._id });

        return res
            .status(200)
            .json(
                new ApiResponse(200, { liked: false, message: 'Like removed' })
            );
    } else {
        // Add like
        await Like.create({
            likedBy: user._id,
            tweet: tweetId,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(201, { liked: true, message: 'Like created' })
            );
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user id');
    }

    // Aggregate liked videos with video and owner details in a nested lookup
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
                pipeline: [
                    // Nested lookup to fetch the owner details inside the video document
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            // Extract the owner from the array and simplify access
                            owner: { $arrayElemAt: ['$owner', 0] },
                        },
                    },
                ],
            },
        },
        {
            $unwind: '$videoDetails',
        },
        {
            $project: {
                _id: 1,
                video: '$videoDetails._id',
                videoTitle: '$videoDetails.title',
                videoDescription: '$videoDetails.description',
                createdAt: '$videoDetails.createdAt',
                owner: {
                    username: '$videoDetails.owner.username',
                    fullname: '$videoDetails.owner.fullname',
                    avatar: '$videoDetails.owner.avatar',
                },
            },
        },
    ]);

    return res.status(200).json(new ApiResponse(200, likedVideos));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

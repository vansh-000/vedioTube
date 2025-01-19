import mongoose, { isValidObjectId } from 'mongoose';
import { Comment } from '../models/comment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.model.js';

const getVideoComments = asyncHandler(async (req, res) => {
    // Get video id from the request

    const { videoId } = req.params;

    // check the validity of the vedioId

    if (!isValidObjectId(videoId)) {
        throw new ApiError('Invalid video id', 400);
    }

    // Find video by id

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError('Video not found', 404);
    }

    // limit the number of comments to 10

    const { page = 1, limit = 10 } = req.query;

    // aggregate pipeline

    const comments = await Comment.aggregate([
        {
            // match video id in the DB
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
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
            $addFields: {
                // the comments may be present or not so $ifNull
                owner: { $ifNull: [{ $arrayElemAt: ['$ownerInfo', 0] }, {}] },
            },
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                'owner.username': 1,
                'owner.fullname': 1,
                'owner.avatar': 1,
            },
        },
        {
            $sort: {
                createdAt: -1, // sorting with newest first
            },
        },
        {
            $skip: (page - 1) * parseInt(limit, 10),
        },
        {
            $limit: parseInt(limit, 10),
        },
    ]);

    // count the number of comments and total no of pages

    const commentCount = await Comment.countDocuments({
        video: new mongoose.Types.ObjectId(videoId),
    });
    const totalPages = Math.ceil(commentCount / limit);

    // return the comments and the total number of pages

    const response = {
        comments,
        totalPages,
        commentCount,
        currentPage: parseInt(page, 10),
    };

    return res
        .status(200)
        .json(new ApiResponse('Comments fetched successfully', 200, response));
});

const addComment = asyncHandler(async (req, res) => {
    // get the videoId from the query
    const { videoId } = req.query;
    // get the comment from the body
    const { content } = req.body;

    // check if the videoId is a valid ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID provided');
    }

    // check if the content is not empty
    if (!content.trim()) {
        throw new ApiError(401, 'content cannot be empty');
    }

    // create a new comment
    const newComment = await Comment.create({
        video: videoId,
        owner: req.user._id,
        content,
    });

    // check error in creating comment
    if (!newComment) {
        throw new ApiError(404, 'Comment not found Please try again');
    }

    // update the comments array
    await newComment.save();

    // return the response
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newComment.toJSON(),
                ' Comment Created Successfully '
            )
        );
});

const updateComment = asyncHandler(async (req, res) => {
    // get the commentId from the params
    const { commentId } = req.params;
    // get the content from the body
    const { content } = req.body;
    // check if the commentId is a valid ObjectId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID provided');
    }
    // find the comment
    const comment = await Comment.findById(commentId);
    // check if the comment exists
    if (!content || content.trim() === '') {
        throw new ApiError(400, 'Content cannot be empty');
    }

    // check if the user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            'You are not authorized to update this comment'
        );
    }
    // update the comment content
    comment.content = content;
    // save the updated comment
    await comment.save();
    // return the response
    res.status(200).json(
        new ApiResponse('Comment updated successfully', 200, {
            comment: comment.content,
        })
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // get the commentId from the params
    const { commentId } = req.params;

    // check if the commentId is a valid ObjectId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID provided');
    }

    // find the comment
    const comment = await Comment.findById(commentId);

    // check if the comment exists
    if (!comment) {
        throw new ApiError(404, 'Comment not found');
    }

    // check if the user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            'You are not authorized to delete this comment'
        );
    }

    // delete the comment
    const deletedCommentDoc = await Comment.findByIdAndDelete(commentId);

    // check if the comment was deleted
    if (!deletedCommentDoc) {
        throw new ApiError(404, 'Comment not found');
    }

    // return the response
    res.status(200).json(
        new ApiResponse(200, {}, 'Comment deleted successfully')
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };

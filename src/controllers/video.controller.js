import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from '../utils/cloudinary.js';

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = '',
        sortBy = 'createdAt',
        sortType = 'desc',
        userId,
    } = req.query;

    // Ensure `page` and `limit` are numbers
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const pageSize = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;

    // Build the filter object
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: 'i' }; // Case-insensitive title search
    }
    if (userId) {
        filter.owner = userId; // Filter by owner if provided
    }

    // Build the sort object
    const sort = {};
    if (sortBy && sortType) {
        sort[sortBy] = sortType === 'asc' ? 1 : -1;
    }

    // Fetch videos with pagination

    const videos = await Video.find(filter)
        .sort(sort)
        .skip((pageNumber - 1) * pageSize) // -> Skips a specified number of documents to implement pagination.
        .limit(pageSize);

    // Count total documents matching the filter
    const totalVideos = await Video.countDocuments(filter);

    // Build the response object
    const response = {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalVideos / pageSize),
        totalVideos,
        videos,
    };

    // check the response
    if (!response) {
        return res.status(404).json({ message: 'No data found' });
    }

    // Send response
    return res
        .status(200)
        .json(new ApiResponse(200, 'Videos fetched successfully', response));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Validate inputs
    const video = req.files?.video?.[0]?.path;
    const thumbnail = req.files?.thumbnail?.[0]?.path;
    if (!title || !description || !video || !thumbnail) {
        throw new ApiError(
            400,
            'Title, description, video, and thumbnail are required'
        );
    }

    // Upload video to Cloudinary
    const uploadedVideo = await uploadOnCloudinary(video);
    if (!uploadedVideo.url) {
        throw new ApiError(500, 'Failed to upload video to Cloudinary');
    }

    // Upload thumbnail to Cloudinary
    const uploadedThumbnail = await uploadOnCloudinary(thumbnail);
    if (!uploadedThumbnail.url) {
        throw new ApiError(500, 'Failed to upload thumbnail to Cloudinary');
    }

    // Get video duration
    const duration = uploadedVideo.duration || 0;

    // Create video record in the database
    const newVideo = await Video.create({
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        title,
        description,
        duration,
        owner: req.user._id,
    });

    // Send response
    return res
        .status(201)
        .json(new ApiResponse(201, 'Video published successfully', newVideo));
});

const getVideoById = asyncHandler(async (req, res) => {
    // get videoId by id
    const { videoId } = req.params;
    // cehck if videoId is valid
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video id');
    }
    // get video by id
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }
    // send response
    return res
        .status(200)
        .json(new ApiResponse(200, 'Video found and returned', video));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // take title, description, thumbnail from req.body
    const { title, description, thumbnail } = req.body;
    // check if videoId is valid
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video id');
    }
    // get video by id
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }
    // check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You are not authorized to update this video');
    }
    // update thumbnail
    if (thumbnail) {
        // delete old thumbnail
        await deleteFromCloudinary(video.thumbnail);

        // upload new thumbnail
        const uploadedThumbnail = await uploadOnCloudinary(thumbnail);

        // check for URL
        if (!uploadedThumbnail.url) {
            throw new ApiError(500, 'Failed to upload thumbnail to Cloudinary');
        }

        // update video thumbnail
        video.thumbnail = uploadedThumbnail.url;
    }
    // update title and description
    if (title) {
        video.title = title;
    }
    if (description) {
        video.description = description;
    }
    await video.save();
    // send response
    return res
        .status(200)
        .json(new ApiResponse(200, 'Video updated successfully', video));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video id');
    }

    // Fetch video from the database
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You are not authorized to delete this video');
    }

    // complex tasks so wrapping in try-catch
    try {
        // Delete video file from Cloudinary
        if (video.videoFile) {
            await deleteFromCloudinary(video.videoFile);
        }

        // Delete thumbnail from Cloudinary
        if (video.thumbnail) {
            await deleteFromCloudinary(video.thumbnail);
        }
    } catch (error) {
        console.error(
            'Error while deleting resources from Cloudinary:',
            error.message
        );
        throw new ApiError(500, 'Failed to delete video resources');
    }

    // Delete the video record from the database
    await video.deleteOne();

    // Send success response
    return res
        .status(200)
        .json(new ApiResponse(200, 'Video deleted successfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // check if videoId is valid
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video id');
    }
    // check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }
    // check video ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            'You are not authorized to toggle publish status'
        );
    }
    // toggle publish status
    video.isPublished = !video.isPublished;
    await video.save();
    // send response
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Video publish status updated successfully',
                video
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};

import mongoose, { isValidObjectId } from 'mongoose';
import { Playlist } from '../models/playlist.model.js';
import { Video } from '../models/video.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // check for name and description
    if (!name || !description) {
        return new ApiError(400, 'Name and description are required');
    } else {
        // check if the name is already taken
        const playlistExists = await Playlist.findOne({ name });
        if (playlistExists) {
            throw new ApiError(400, 'Playlist name already exists');
        }
    }

    // create the playlist
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });

    // check for the playlist
    if (!playlist) {
        throw new ApiError(400, 'Failed to create playlist');
    }

    // return the playlist
    return res.json(new ApiResponse(201, 'Playlist created', playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // check for user id
    if (!isValidObjectId(userId)) {
        return new ApiError(400, 'Invalid user id');
    }
    // get the user playlists along with the videoOwner details
    try {
        // Fetch playlists for the user
        const playlists = await Playlist.find({ owner: userId })
            .populate({
                path: 'videos',
                populate: {
                    path: 'owner',
                    select: 'username fullname avatar', // Get details of the video owner
                },
            })
            .populate('owner', 'username fullname avatar'); // Get the playlist owner details

        if (!playlists.length) {
            return res.status(404).json({
                success: false,
                message: 'No playlists found for this user',
            });
        }

        return res.json({
            success: true,
            message: 'User playlists retrieved successfully',
            data: playlists,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve user playlists',
            error: error.message,
        });
    }
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // check for playlist id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID');
    }
    // get the playlist using the playlist id
    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: 'videos',
            populate: {
                path: 'owner',
                select: 'username fullname avatar', // Get details of the video owner
            },
        })
        .populate('owner', 'username fullname avatar'); // Get the playlist owner details
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, 'Playlists retrieved successfully', playlist)
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // check if the playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    // check if the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    // add the video to the playlist
    playlist.videos.push(videoId);
    await playlist.save();

    // return the updated playlist
    return res.json(new ApiResponse(200, 'Video added to playlist', playlist));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // take the playlistId and videoId from the request params
    const { playlistId, videoId } = req.params;

    // check if the playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    // check if the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    // checck if the video is in the playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(404, 'Video not in playlist');
    }

    // remove the video from the playlist
    playlist.videos.pull(videoId);
    await playlist.save();

    // return the updated playlist
    return res.json(
        new ApiResponse(200, 'Video removed from playlist', playlist)
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // check for playlist id
    if (!playlistId) {
        throw new ApiError(400, 'Playlist ID is required');
    }

    // check if user is the owner of the playlist
    if (playlist.owner !== mongoose.Types.ObjectId(req.user._id)) {
        throw new ApiError(
            403,
            'You are not authorized to delete this playlist'
        );
    }

    // delete the playlist
    const playlist = await Playlist.findByIdAndDelete(playlistId);

    // check for the playlist
    if (!playlist) {
        throw new ApiError(400, 'Playlist not found');
    }

    // return the playlist
    return res.json(new ApiResponse(200, 'Playlist deleted', playlist));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // check for playlist id
    if (!playlistId) {
        throw new ApiError(400, 'Playlist ID is required');
    }

    // check if user is the owner of the playlist
    if (playlist.owner !== mongoose.Types.ObjectId(req.user._id)) {
        throw new ApiError(
            403,
            'You are not authorized to update this playlist'
        );
    }

    // update the playlist
    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
        name,
        description,
    });

    // check for the playlist
    if (!playlist) {
        throw new ApiError(400, 'Playlist not found');
    }

    // return the playlist
    return res.json(new ApiResponse(200, 'Playlist updated', playlist));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};

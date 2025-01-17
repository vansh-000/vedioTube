import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { User, isPasswordCorrect } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// ACCESS AND REFRESH TOKEN GENERATER
const generateAccessAndRefreshToken = async (id) => {
    try {
        const user = await User.findById(id);

        if (!user) {
            throw new ApiError('Something went wrong', 500);
        }

        const accessToken = user.generateAcessToken();
        const refreshToken = user.generateRefreshToken();

        // console.log(accessToken,refreshToken)
        // update the refresh token in user object
        user.refreshToken = refreshToken;

        // save the user in DB
        // don't validate the user otherwise it will expect a password
        await user.save({ validateBeforeSave: false });

        // return access and refresh token
        return { accessToken, refreshToken };
    } catch (error) {
        // console.error('Error generating tokens:', error);
        throw new ApiError('Error creating access and refresh token', 500);
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // Get user data from request body
    const { username, fullname, email, password } = req.body;

    // validation - fields not empty string
    if (!username || !fullname || !email || !password) {
        throw new ApiError('All fields are required', 400);
    }

    // check if user already exists
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError('Email already exists', 409);
    }

    const duplicateUsername = await User.findOne({ username });
    if (duplicateUsername) {
        throw new ApiError('Username already exists', 409);
    }

    // check for images, avatars
    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;

    // will give rise to an error if coverIMage is not uploades since we are extractiong the
    // coverImage if req.files exists which will continue to exist even if avatar is uploaded
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError('Avatar is required', 400);
    }

    // upload them on cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError('Avatar is required', 400);
    }

    // create user object - create user in database
    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage.url,
        fullname,
        email,
        password,
    });

    //remove password and refresh
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    // check for user creation
    if (!createdUser) {
        throw new ApiError('User creation failed', 500);
    }

    // return response
    return res
        .status(201)
        .json(
            new ApiResponse('User registered Successfully', 200, createdUser)
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // get data from body
    const { username, email, password } = req.body;

    // check username and email
    if (!username && !email) {
        throw new ApiError('Username or Email is required', 400);
    }

    // find user
    const user = await User.findOne({
        $or: [
            { username: username?.toLowerCase() },
            { email: email?.toLowerCase() },
        ],
    });
    if (!user) {
        throw new ApiError('User not found', 404);
    }

    // authenticate password
    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
        throw new ApiError('Invalid credentials', 401);
    }

    // generate acces and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    // console.log(accessToken,refreshToken)

    // update the user
    const loggedInUser = await User.findByIdAndUpdate(user._id).select(
        '-password -refreshToken'
    );

    // generate cookies
    const cookiesOptions = {
        httpOnly: true,
        secure: true,
    };

    // send cookies
    return res
        .status(200)
        .cookie('accessToken', accessToken, cookiesOptions)
        .cookie('refreshToken', refreshToken, cookiesOptions)
        .json(
            new ApiResponse('User logged in Successfully', 200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    try {
        // we don't have the access of the user so we will take a middleware that
        // takes accessToken and finds the user and injects the user in req

        await User.findByIdAndUpdate(
            // taking access of user form req.user
            req.user._id,
            {
                $set: {
                    refreshToken: undefined,
                },
            },
            // get the updated user
            {
                new: true,
            }
        );

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
        };

        // clear the cookies

        return res
            .status(200)
            .clearCookie('accessToken', cookiesOptions)
            .clearCookie('refreshToken', cookiesOptions)
            .json(new ApiResponse('User logged out Successfully', 200));
    } catch (error) {
        console.error('Error during logout:', error);
        throw new ApiError('Logout failed', 500);
    }
});

// generating a new access token if refereshToken exists
const refreshAccessToken = asyncHandler(async (req, res) => {
    // store incomming referesh token

    const incommingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    // if refreshToken exists verify if its correct

    if (!incommingRefreshToken) {
        throw new ApiError('Refresh Token expired', 401);
    }

    // verify the token

    const decoded = await jwt.verify(
        incommingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    // if correct make db call to get user

    try {
        const user = await User.findById(decoded._id);

        if (!user) {
            throw new ApiError('Refresh Token expired', 401);
        }

        // check if user has a valid refershToken

        if (incommingRefreshToken != user?.refreshToken) {
            throw new ApiError('Refresh Token expired', 401);
        }

        // generate new accessToken and refreshToken

        const { newAccessToken, newRefreshToken } =
            generateAccessAndRefreshToken(user._id);

        // generate cookiesOptions
        const cookiesOptions = {
            httpOnly: true,
            secure: true,
        };

        // respond with new accessToken and refreshToken
        return res
            .status(200)
            .cookie('accessToken', newAccessToken, cookiesOptions)
            .cookie('refreshToken', newRefreshToken, cookiesOptions)
            .json(
                new ApiResponse(
                    {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                    },
                    200
                )
            );
    } catch (error) {
        throw new ApiError(error?.message || 'Invalid Refresh Token', 401);
    }
});

const changePassword = asyncHandler(async (req, res) => {
    // take old password from req.body
    const { oldPassword, newPassword } = req.body;

    // get user from req.user using middleware validate JWT
    const user = await User.findById(req.user._id);

    // check old password
    const isOldPasswordCorrect = await isPasswordCorrect(oldPassword);
    if (!isOldPasswordCorrect) {
        throw new ApiError('Old password is incorrect', 400);
    }

    // change password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    // return success response
    return res.status(200).json(
        new ApiResponse(
            {
                message: 'Password changed successfully',
            },
            200
        )
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    // get user from req.user using middleware validate JWT
    return res
        .status(200)
        .json(new ApiResponse('User fetched successfully', 200, req.user));
});

const updateUserDetails = asyncHandler(async (req, res) => {
    // get user fields from req.body

    const { username, fullname } = req.body;

    // if no field is provided
    if (!username && !fullname) {
        throw new ApiError('No fields provided for updation !!!', 400);
    }

    // check if username or email already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { fullname }],
        _id: { $ne: req.user._id },
    });

    if (existingUser) {
        throw new ApiError('Username or Email already exists', 400);
    }

    const changedFields = {};

    if (username) {
        changedFields['username'] = username;
    }
    if (fullname) {
        changedFields['fullname'] = fullname;
    }

    // get user from req.user using middleware validate JWT
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email,
            },
        },
        { new: true }
    ).select('-password');
    if (!user) {
        throw new ApiError('User not found', 404);
    }

    // send success response

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'Account details updated successfully')
        );
});

const updateAvatar = asyncHandler(async (req, res) => {
    // get files from req.files
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is missing');
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, 'Error while uploading on Cloudinary');
    }

    // get user from req.user using middleware validate JWT
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select('-password');
    // send success response
    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Avatar image updated successfully'));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    // get files from req.files
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError('Cover Image is required', 400);
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) {
        throw new ApiError('Cover Image upload failed', 500);
    }

    // get user from req.user using middleware validate JWT
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select('-password');
    // send success response
    return res
        .status(200)
        .json(new ApiResponse('Cover Image updated successfully', 200, user));
});

// AGGREGATED PIPLENINE IS USED TO GET THE USER PROFILE

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // get username
    const { username } = req.params;

    // trim the username to remove empty spaces and check if it exists
    if (!username?.trim()) {
        throw new ApiError('Username is required', 400);
    }

    /* 
    make an aggrigate pipeline to get no. of 
    subscribers and no. of channels user subscribed
    */
    const userChannel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() },
        },
        {
            // no. of subscribers
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers',
            },
        },
        {
            // no. of channels user subscribed
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo',
            },
        },
        {
            $addFields: {
                // get the size of the array of subscribers and subscribedTo
                subscriberCount: { $size: '$subscribers' },
                channelsSubscribedToCount: { $size: '$subscribedTo' },
                // set a flag if the user is subscribed to the channel for this
                // we will check if the user id is in the array of subscribers Schema
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                fullname: 1,
                email: 1,
            },
        },
    ]);

    // check if userChannel exists
    if (!userChannel?.length) {
        throw new ApiError('User not found', 404);
    }

    // send success response

    return res
        .status(200)
        .json(
            new ApiResponse('User fetched successfully', 200, userChannel[0])
        );
});

// SUB AGGREGATE PIPELINE TO GET THE WATCH HISTORY OF THE USER
// to get into videos from user and then populating the owner details from user Schema

const getWatchHistory = asyncHandler(async (req, res) => {
    // get user from req.user using middleware validate JWT
    const user = req.user;

    // check for userValidity
    if (!user) {
        throw new ApiError('User not found', 404);
    }

    // aggregated pipeline to find user with the id
    const fullUser = await User.aggregate([
        {
            $match: {
                //  _id: user._id, THIS IS INCORRECT AS _id is an object id and user._id is a string
                _id: mongoose.Types.ObjectId(user._id),
            },
        },
        {
            // now we will lookup the videos watched by the user
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                // we will populate the owner details form the video schema
                pipeline: [
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
                            // overwriting user with the first element of the array for easy access by frontend
                            owner: { $arrayElemAt: ['$owner', 0] },
                        },
                    },
                ],
            },
        },
    ]);

    // return the response
    return res.status(200).json(
        new ApiResponse('Watch History fetched successfully', 200, {
            watchHistory: fullUser[0]?.watchHistory,
        })
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAvatar,
    updateUserDetails,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};

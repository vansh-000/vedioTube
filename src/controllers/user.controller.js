import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

export { registerUser };

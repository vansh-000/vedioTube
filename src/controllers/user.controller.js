import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { User } from '../models/user.model.js';
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

export { registerUser, loginUser, logoutUser };

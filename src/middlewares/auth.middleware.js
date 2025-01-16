import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// if res is not used we replace it by _ to avoid warning
export const validateJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized Token' });
        }
        const decoded = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
        // access token has a field called _id
        const user = await User.findById(decoded?._id).select(
            '-password -refreshToken'
        );
        if (!user) {
            return res
                .status(401)
                .json(new ApiError('Invalid access token', 401));
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json(new ApiError('Invalid access token', 401));
    }
});

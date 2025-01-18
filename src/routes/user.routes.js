import { Router } from 'express';
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    updateCoverImage,
    updateAvatar,
    updateUserDetails,
    getCurrentUser,
    changePassword,
    getUserChannelProfile,
    getWatchHistory,
} from '../controllers/user.controller.js';
import { upload } from './../middlewares/multer.middleware.js';
import { validateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// register router
router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
    ]),
    registerUser
);

// login router
router.route('/login').post(loginUser);

// PROTECTED ROUTES
// validateJWT is a middleware that is injected in the route and the next allows it to execute the next logoutUser
router.route('/logout').post(validateJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(validateJWT, changePassword);
router.route('/current-user').get(validateJWT, getCurrentUser);
router.route('/update-account').patch(validateJWT, updateUserDetails);

router
    .route('/avatar')
    .patch(validateJWT, upload.single('avatar'), updateAvatar);
router
    .route('/cover-image')
    .patch(validateJWT, upload.single('coverImage'), updateCoverImage);

router.route('/c/:username').get(validateJWT,getUserChannelProfile);
router.route('/history').patch(validateJWT,getWatchHistory);

export default router;

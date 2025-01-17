import { Router } from 'express';
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    updateCoverImage,
    updateUserAvatar,
    updateUserAccount,
    getCurrentUser,
    changePassword,
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
router.route('./refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT, changePassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/update-account').patch(verifyJWT, updateUserAccount);

router
    .route('/avatar')
    .patch(verifyJWT, upload.single('avatar'), updateUserAvatar);
router
    .route('/cover-image')
    .patch(verifyJWT, upload.single('coverImage'), updateCoverImage);

export default router;

import { Router } from 'express';
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
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

export default router;

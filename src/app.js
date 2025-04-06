import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

// MIDDLEWARES

// CORS
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
// JSON VALIDATER AND LIMITER
app.use(express.json({ limit: '16kb' }));

app.use(
    express.urlencoded({
        extended: true,
        limit: '16kb',
    })
);

app.use(express.static('public'));

// COOKIE PARSER to use crud operation on special cookies
app.use(cookieParser());

// ROUTES

import userRouter from './routes/user.routes.js';
app.use('/api/v1/users', userRouter);
import productRouter from './routes/product.routes.js';
app.use('/api/v1/products', productRouter);
import videoRouter from './routes/video.routes.js';
app.use('/api/v1/videos', videoRouter);
import tweetRouter from './routes/tweet.routes.js';
app.use('/api/v1/tweets', tweetRouter);
import dashboardRouter from './routes/dashboard.routes.js';
app.use('/api/v1/dashboard', dashboardRouter);
import commentRouter from './routes/comment.routes.js';
app.use('/api/v1/comments', commentRouter);
import healthcheckRouter from './routes/healthcheck.routes.js';
app.use('/api/v1/healthcheck', healthcheckRouter);
import likeRouter from './routes/like.routes.js';
app.use('/api/v1/likes', likeRouter);
import subscriptionRouter from './routes/subscription.routes.js';
app.use('/api/v1/subscriptions', subscriptionRouter);

export { app };

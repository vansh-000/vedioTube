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

// routes import
import userRouter from './routes/user.routes.js';

// routes declaration
app.use('/api/v1/users',userRouter);

export { app };

import dotenv from 'dotenv';
import { dbConnect } from './db/index.js';
import { app } from './app.js';
dotenv.config({
    path: './.env',
});

dbConnect()
.then(()=>{
    app.on('error', (error) => {
        console.error('🔴 Error interacting with database: ', error);
    });
    app.listen(process.env.PORT||5000,()=>{
        console.log(`🟢 Server is running on port ${process.env.PORT||5000}`);
    })
})
.catch((error)=>{
    console.log('🔴 MongoDB connection failed !!!', error);
});

/* 
import mongoose from 'mongoose';
import express from 'express';
import { DB_NAME } from './constants.js';
const app = express();
(async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log('🟢 Connected to MongoDB !!!');
        app.on('error', (error) => {
            console.error('🔴 Error interacting with database: ', error);
        });
        app.listen(process.env.PORT,()=>{
            console.log(`🟢 Server is running on port : ${connectionInstance.connection.host}`);
        })
    } catch (error) {
        console.error('🔴 DataBase Connection ERROR \n', error);
    }
})();

*/
import { v2 as cloudinary } from 'cloudinary';
import { unlinkSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload file to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto', // Handles images, videos, etc.
        });

        // Remove the local file
        unlinkSync(localFilePath);

        return uploadResult;
    } catch (error) {
        // Remove the local file if upload fails
        try {
            unlinkSync(localFilePath);
        } catch (err) {
            console.error('Error while deleting local file:', err.message);
        }
        console.error('Error uploading file to Cloudinary:', error.message);
        return null;
    }
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'auto', // Handles images, videos, etc.
        });
        return result;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error.message);
        return null;
    }
};

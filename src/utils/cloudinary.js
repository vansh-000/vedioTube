import { v2 as cloudinary } from 'cloudinary';
import { unlink } from 'node:fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image from the local server to cloudinary

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload file on cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        // file has been uploaded on the cloudinary
        console.log('🟢 File has been uploaded on CLOUDINARY !!!');
        console.log(uploadResult.url);
        return uploadResult;
    } catch (error) {
        console.error('🔴 Error while uploading file on CLOUDINARY !!!');
        // removed the file from the local machine as upload failed
        unlink(localFilePath);
        return null;
    }
};

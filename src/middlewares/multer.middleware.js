import multer from 'multer';

const storage = multer.diskStorage({
    // cb is the callback function
    // req.file is the uploaded file
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

export const upload = multer({ storage: storage });

const asyncHandler = (fn) => {
    async (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => next(error));
    };
};


/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        res.error(error.code || 500, {
            message: error.message,
            success: false,
        });
    }
};
*/

export { asyncHandler };


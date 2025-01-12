class ApiError extends Error {
    constructor(
        message = 'Something went wrong',
        statusCode,
        errors = [],
        stack = ''
    ) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
        this.data = null;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
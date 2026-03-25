module.exports = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error status and message
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log detailed error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', err.stack);
    }

    // Send error response
    res.status(status).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

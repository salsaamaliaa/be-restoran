module.exports = {
    response: (status, message, data) => {
        if (data !== undefined && data !== null) {
            return {
                status: status,
                message: message,
                data: data,
            };
        } else {
            return {
                status: status,
                message: message,
            };
        }
    }
};
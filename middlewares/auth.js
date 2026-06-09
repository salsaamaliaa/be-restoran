const jwt = require('jsonwebtoken');
const { response } = require('../helpers/response.formatter');
const { auth_secret } = require('../config/base.config');

const getTokenFromHeader = (authHeader) => {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        return parts[1];
    }

    if (parts.length === 1) {
        return parts[0];
    }

    return null;
};

const verifyJwt = (token) => jwt.verify(token, auth_secret || 'rahasia123');

const handleAuthError = (error, res) => {
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json(response(401, 'Token expired, please login again'));
    }
    return res.status(401).json(response(401, 'Invalid token'));
};

module.exports = {
    verifyToken: (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json(response(401, 'Unauthorized: No token provided'));
        }

        const token = getTokenFromHeader(authHeader);
        if (!token) {
            return res.status(401).json(response(401, 'Invalid token format'));
        }

        try {
            const decoded = verifyJwt(token);
            req.user = decoded;
            next();
        } catch (error) {
            return handleAuthError(error, res);
        }
    },

    verifyAdmin: (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json(response(401, 'Unauthorized: No token provided'));
        }

        const token = getTokenFromHeader(authHeader);
        if (!token) {
            return res.status(401).json(response(401, 'Invalid token format'));
        }

        try {
            const decoded = verifyJwt(token);
            req.user = decoded;

            if (decoded.role !== 'admin') {
                return res.status(403).json(response(403, 'Forbidden: Admin only'));
            }

            next();
        } catch (error) {
            return handleAuthError(error, res);
        }
    },

    verifyDriver: (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json(response(401, 'Unauthorized: No token provided'));
        }

        const token = getTokenFromHeader(authHeader);
        if (!token) {
            return res.status(401).json(response(401, 'Invalid token format'));
        }

        try {
            const decoded = verifyJwt(token);
            req.user = decoded;

            if (decoded.role !== 'driver' && decoded.role !== 'admin') {
                return res.status(403).json(response(403, 'Forbidden: Driver or Admin only'));
            }

            next();
        } catch (error) {
            return handleAuthError(error, res);
        }
    }
};
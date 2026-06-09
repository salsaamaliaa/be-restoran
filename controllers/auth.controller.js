const Validator = require("fastest-validator");
const v = new Validator();
const { User } = require("../models");
const { response } = require("../helpers/response.formatter");
const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const { auth_secret } = require('../config/base.config');

module.exports = {
    loginAuth: async (req, res) => {
        try {
            const { username, password, role } = req.body;
            const allowedRoles = ['customer', 'admin', 'driver'];

            const schema = {
                username: { type: "string" },
                password: { type: "string" },
                role: { type: "string", optional: true, enum: allowedRoles }
            };
            const data = { username, password, role };

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            const user = await User.findOne({ where: { username: data.username } });
            if (!user) {
                return res.status(400).json(response(400, "Validasi Error", "Username tidak terdaftar"));
            }

            if (data.role && user.role !== data.role) {
                return res.status(403).json(response(403, "Validasi Error", `Akun bukan ${data.role}`));
            }

            const checkPassword = passwordHash.verify(data.password, user.password);
            if (!checkPassword) {
                return res.status(400).json(response(400, "Validasi Error", "Password tidak sesuai"));
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                auth_secret,
                { expiresIn: '8h' }
            );

            const formatOutput = {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role
                },
                token: token
            };

            return res.status(200).json(response(200, "Login berhasil", formatOutput));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    register: async (req, res) => {
        try {
            const { name, username, password, role } = req.body;

            const schema = {
                name: { type: "string", min: 2 },
                username: { type: "string", min: 3 },
                password: { type: "string", min: 6 },
                role: { type: "string", optional: true }
            };

            const allowedRoles = ['customer', 'admin', 'driver'];
            const safeRole = allowedRoles.includes(role) ? role : 'customer';

            const data = { name: name || '', username, password, role: safeRole };

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            const existing = await User.findOne({ where: { username: data.username } });
            if (existing) {
                return res.status(400).json(response(400, "Validasi Error", "Username sudah digunakan"));
            }

            const hashedPassword = passwordHash.generate(data.password);
            const user = await User.create({
                name: data.name,
                username: data.username,
                password: hashedPassword,
                role: data.role
            });

            return res.status(201).json(response(201, "Registrasi berhasil", {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
};
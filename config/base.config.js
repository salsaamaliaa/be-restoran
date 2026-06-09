require('dotenv').config()

module.exports = {
    "app_name": process.env.APP_NAME,
    "base_url": process.env.BASE_URL,
    "auth_secret": process.env.AUTH_SECRET
}
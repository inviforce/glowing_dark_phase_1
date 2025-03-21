const { sign } = require("jsonwebtoken");

function createAccessToken(userid, privilege) {
    const SECRET_KEYS = {
        "CSR": process.env.ACCESS_TOKEN_SECRET_CSR,
        "STUDENT": process.env.ACCESS_TOKEN_SECRET_STUDENT,
        "ADMIN": process.env.ACCESS_TOKEN_SECRET_ADMIN,
        "ORGANIZATION": process.env.ACCESS_TOKEN_SECRET_ORGANIZATION,
    };

    const secretKey = SECRET_KEYS[privilege];
    if (!secretKey) {
        throw new Error("Invalid privilege type");
    }

    return sign({ userid, privilege }, secretKey, { expiresIn: "10m" }); // 1-minute expiration
}

function createRefreshToken(userid, privilege) {
    const SECRET_KEYS = {
        "CSR": process.env.REFRESH_TOKEN_SECRET_CSR,
        "STUDENT": process.env.REFRESH_TOKEN_SECRET_STUDENT,
        "ADMIN": process.env.REFRESH_TOKEN_SECRET_ADMIN,
        "ORGANIZATION": process.env.REFRESH_TOKEN_SECRET_ORGANIZATION,
    };

    const secretKey = SECRET_KEYS[privilege];
    if (!secretKey) {
        throw new Error("Invalid privilege type");
    }

    return sign({ userid, privilege }, secretKey, { expiresIn: "7d" }); // 7-day expiration
}

function sendAccessToken(res, accessToken) {
    try {
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,   // Use HTTPS in production
            sameSite: "Lax", // Prevent CSRF but allow same-site requests
            path: "/",
            expires: new Date(Date.now() + 20*60 * 1000), // Expire in 1 minute
        });
    } catch (error) {
        console.error("❌ Error sending access token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

function sendRefreshToken(res, refreshToken) {
    try {
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,   // Use HTTPS in production
            sameSite: "Lax", // Prevent CSRF but allow same-site requests
            path: "/",
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire in 7 days
        });
    } catch (error) {
        console.error("❌ Error sending refresh token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken
};

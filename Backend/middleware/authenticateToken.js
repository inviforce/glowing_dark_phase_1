const jwt = require("jsonwebtoken");
const {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken
} = require("../token_order/token");
/**
 * Retrieves the secret key based on the privilege and token type.
 */
function getSecretKey(privilege, type) {
    const secrets = {
        CSR: {
            access: process.env.ACCESS_TOKEN_SECRET_CSR,
            refresh: process.env.REFRESH_TOKEN_SECRET_CSR
        },
        STUDENT: {
            access: process.env.ACCESS_TOKEN_SECRET_STUDENT,
            refresh: process.env.REFRESH_TOKEN_SECRET_STUDENT
        },
        ADMIN: {
            access: process.env.ACCESS_TOKEN_SECRET_ADMIN,
            refresh: process.env.REFRESH_TOKEN_SECRET_ADMIN
        },
        COUNSELLOR: {
            access: process.env.ACCESS_TOKEN_SECRET_COUNSELLOR,
            refresh: process.env.REFRESH_TOKEN_SECRET_COUNSELLOR
        },
        ORGANIZATION: {
            access: process.env.ACCESS_TOKEN_SECRET_ORGANIZATION,
            refresh: process.env.REFRESH_TOKEN_SECRET_ORGANIZATION
        }
    };
    return secrets[privilege]?.[type] || null;
}

/**
 * Middleware to authenticate access token and optionally check privileges.
 */
function authenticateToken(requiredPrivilege = null) {
    return (req, res, next) => {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({ message: "No access token provided" });
        }

        const decoded = jwt.decode(accessToken);
        if (!decoded || !decoded.privilege) {
            return res.status(403).json({ message: "Invalid access token" });
        }

        const secretKey = getSecretKey(decoded.privilege, "access");
        if (!secretKey) {
            return res.status(403).json({ message: "Invalid privilege type" });
        }

        jwt.verify(accessToken, secretKey, async (err, user) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return refreshAccessToken(req, res, next);
                }
                return res.status(403).json({ message: "Invalid access token" });
            }

            if (requiredPrivilege && user.privilege !== requiredPrivilege) {
                return res.status(403).json({ message: "Insufficient privileges" });
            }

            req.user = user;
            next();
        });
    };
}

/**
 * Refreshes access token using the refresh token.
 */
function refreshAccessToken(req, res, next) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.decode(refreshToken);
    if (!decoded || !decoded.privilege) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }

    const secretKey = getSecretKey(decoded.privilege, "refresh");
    if (!secretKey) {
        return res.status(403).json({ message: "Invalid privilege type" });
    }

    jwt.verify(refreshToken, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Refresh token expired, please log in again" });
        }

        const accessToken = createAccessToken(user._id, decoded.privilege);
        // Send Refresh Token as HTTP-Only Cookie 
        sendAccessToken(res, accessToken);


        req.user = user;
        next();
    });
}

module.exports = { authenticateToken, refreshAccessToken };

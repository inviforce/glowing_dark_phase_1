const jwt = require("jsonwebtoken");
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken
} = require("../token_order/token");

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
      refresh: process.env.ACCESS_TOKEN_SECRET_ORGANIZATION
    }
  };
  return secrets[privilege]?.[type] || null;
}

function verifyToken(token, secretKey) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

function authenticateToken(requiredPrivilege = null) {
  return async (req, res, next) => {
    try {
      const accessToken = req.cookies?.accessToken;
      console.log(accessToken);
      if (!accessToken) {
        console.log("no access token provided so refreshing")
        return refreshAccessToken(req,res,next);
      }

      const decoded = jwt.decode(accessToken);
      if (!decoded || !decoded.privilege) {
        return res.status(403).json({ message: "Invalid access token" });
      }

      const secretKey = getSecretKey(decoded.privilege, "access");
      if (!secretKey) {
        return res.status(403).json({ message: "Invalid privilege type" });
      }

      const user = await verifyToken(accessToken, secretKey);

      if (requiredPrivilege && user.privilege !== requiredPrivilege) {
        return res.status(403).json({ message: "Insufficient privileges" });
      }

      req.user = user;
      return next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return await refreshAccessToken(req, res, next);
      }
      return res.status(403).json({ message: "Invalid or expired access token" });
    }
  };
}

async function refreshAccessToken(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided. Please log in again" });
    }

    const decoded = jwt.decode(refreshToken);
    if (!decoded || !decoded.privilege) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const secretKey = getSecretKey(decoded.privilege, "refresh");
    if (!secretKey) {
      return res.status(403).json({ message: "Invalid privilege type" });
    }

    const user = await verifyToken(refreshToken, secretKey);
    const accessToken = createAccessToken(user._id, decoded.privilege);
    sendAccessToken(res, accessToken);
    req.user = user;
    return next();
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired, please log in again" });
  }
}

module.exports = { authenticateToken, refreshAccessToken };

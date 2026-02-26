const jwt = require('jsonwebtoken');


const isAuthenticated = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Unauthorized! No token provided.'});
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user info to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({message: 'Unauthorized! Invalid token.'});
    }};
       
module.exports = {isAuthenticated};
// Assuming you have a function or middleware to verify JWT tokens
const authenticateMiddleware = (req, res, next) => {
    // Example: Check if there's a valid JWT token in headers or cookies
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Token not found." });
    }
  
    // Example: Verify JWT token (using a library like jsonwebtoken)
    try {
      // Verify and decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user; // Attach user information to request object
      next(); // Continue to the next middleware or route handler
    } catch (error) {
      console.error("JWT Error:", error);
      return res.status(401).json({ message: "Unauthorized. Invalid token." });
    }
  };
  
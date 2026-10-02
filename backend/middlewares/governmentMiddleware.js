const governmentMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (req.user.role !== "government") {
      return res.status(403).json({
        success: false,
        message: "Government access required"
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Government authorization error"
    });
  }
};

export default governmentMiddleware;

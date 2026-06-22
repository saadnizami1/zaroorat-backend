const authorizeRoles = (roles) => {
    return (req, res, next) => {
   try {
   if(!req.user || !roles.includes(req.user.role)){
    return res.status(403).json({message: "Unauthorized Access! , You are not authorized to access this resources "});
   }
   next();
   } catch (error) {
    console.error("Role check error:", error.message);
    return res.status(500).json({ message: "Authorization check failed" });
   }
    };
  };
  
  module.exports = { authorizeRoles };
  
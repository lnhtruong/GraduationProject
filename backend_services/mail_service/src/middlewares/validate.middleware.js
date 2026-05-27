exports.validateEmail = function (req, res, next) {
  // Guard against req.body being undefined (no Content-Type / no payload at all).
  const email = req.body && req.body.email;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  next();
};

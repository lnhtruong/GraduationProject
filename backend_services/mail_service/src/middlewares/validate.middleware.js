exports.validateEmail = function (req, res, next) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  next();
}

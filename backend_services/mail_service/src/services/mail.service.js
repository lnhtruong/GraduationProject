const { mailTransporter } = require('../configs');
const { mailTemplates } = require('../templates');

const send = ({ to, subject, html }) =>
  mailTransporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });

exports.sendOTP = (email, otp) => {
  const { subject, html } = mailTemplates.otp(otp);
  return send({ to: email, subject, html });
};

exports.sendForgotPassword = (email, link) => {
  const { subject, html } = mailTemplates.forgotPassword(link);
  return send({ to: email, subject, html });
};

exports.sendCustom = (email, message) => {
  const { subject, html } = mailTemplates.custom(message);
  return send({ to: email, subject, html });
};

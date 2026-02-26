exports.otp = function (otp) {
    return ({
        subject: 'Your OTP Code',
        html: `<h2>Your OTP: ${otp}</h2><p>Expires in 5 minutes</p>`,
    });
}

exports.forgotPassword = function (link) {
    return ({
        subject: 'Reset Password',
        html: `<a href="${link}">Reset your password</a>`,
    });
}

exports.custom = function (message) {
    return ({
        html: `<p>${message}</p>`,
    });
}

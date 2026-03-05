const { createHmac } = require('crypto');

// Hàm tạo chữ ký HMAC-SHA256
const createSignature = (data, checksumKey) => {
    const hmac = createHmac('sha256', checksumKey);
    hmac.update(data);
    return hmac.digest('hex');
};

// Hàm chuẩn bị dữ liệu và tạo chữ ký
const generatePayloadWithSignature = (orderCode, amount, description, returnUrl, cancelUrl, checksumKey) => {
    // Sắp xếp dữ liệu theo thứ tự alphabet
    const data = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;

    const signature = createSignature(data, checksumKey);

    return {
        orderCode,
        amount,
        description,
        returnUrl,
        cancelUrl,
        signature,
    };
};

module.exports = { createSignature, generatePayloadWithSignature };
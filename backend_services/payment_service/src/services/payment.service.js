const { PayOS } = require("@payos/node");
const { publishPaymentWebhook, publishPaymentSuccess, savePaymentData } = require("./event.publisher");
require("dotenv").config();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

const PORT = process.env.PORT || 3000;
const CANCEL_URL = process.env.PAYOS_CANCEL_URL || `http://localhost:${PORT}/payment/cancel`;
const RETURN_URL = process.env.PAYOS_RETURN_URL || `http://localhost:${PORT}/payment/return`;
const WEBHOOK_URL = process.env.PAYOS_WEBHOOK_URL // Must public url

const setupWebhookUrl = async () => {
  try {
    await payos.webhooks.confirm(WEBHOOK_URL);
    console.log("Webhook registered successfully");
  } catch (err) {
    console.error(err);
  }
};

// Gọi setup webhook khi module được load
setupWebhookUrl();

/**
 * Tạo đơn hàng trên PayOS
 */
const createPaymentLink = async (amount) => {
  const orderCode = Date.now();
  const body = {
    orderCode: orderCode,
    amount: amount,
    description: "Thanh toán bằng mã QR",
    cancelUrl: CANCEL_URL,
    returnUrl: RETURN_URL,
  };

  const paymentLinkResponse = await payos.paymentRequests.create(body);

  // Tự hủy sau 5 phút nếu chưa thanh toán (Logic đơn giản bằng setTimeout)
  setTimeout(async () => {
    try {
      const paymentInfo = await payos.paymentRequests.get(orderCode);
      if (paymentInfo && paymentInfo.status !== "PAID") {
        await payos.paymentRequests.cancel(orderCode, "Expired");
        console.log(`❌ Huỷ đơn hàng ${orderCode} sau 5 phút`);
      }
    } catch (e) {
      console.error("Lỗi khi tự động huỷ đơn: ", e.message);
    }
  }, 5 * 60 * 1000);

  return {
    orderCode: paymentLinkResponse.orderCode,
    checkoutUrl: paymentLinkResponse.checkoutUrl,
    qrCode: paymentLinkResponse.qrCode
  };
};

/**
 * Kiểm tra trạng thái đơn hàng
 */
const getOrderStatus = async (orderCode) => {
  const paymentInfo = await payos.paymentRequests.get(orderCode);
  return paymentInfo.status;
};

/**
 * Xử lý callback từ PayOS
 */
const payosCallback = async (req) => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (webhookData) {
      console.log(`💵 Đơn hàng ${webhookData.orderCode} đã thanh toán thành công!`);
      console.log("webhookDatakk: ", webhookData);

      // � Lưu payment data vào Redis với key: PAYMENT_${orderCode}
      await savePaymentData(webhookData.orderCode, webhookData);

      // �📢 Publish webhook event để các service khác có thể subscribe
      publishPaymentWebhook(webhookData);

      // 📢 Publish payment success event
      publishPaymentSuccess(webhookData.orderCode, webhookData);

      // 👉 Cập nhật trạng thái vào DB nếu có
      return { message: "Callback nhận thành công", data: webhookData };
    } else {
      const error = new Error("Chữ ký không hợp lệ");
      error.status = 403;
      throw error;
    }
  } catch (error) {
    console.error("Lỗi xác thực webhook:", error.message);
    const err = new Error(error.message || "Lỗi xử lý webhook");
    err.status = error.status || 403;
    throw err;
  }
};

module.exports = {
  createPaymentLink,
  getOrderStatus,
  payosCallback,
};
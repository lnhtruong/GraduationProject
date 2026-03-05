const axios = require("axios");
const { generatePayloadWithSignature } = require("../utils/createSignature.util");
const { verifySignature } = require("../utils/verifySignature.util");
require("dotenv").config();

const CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const API_KEY = process.env.PAYOS_API_KEY;
const CHECKSUM_KEY = process.env.PAYOS_CHECK_SUM;
const PORT = process.env.PORT || 3000;
const CANCEL_URL = process.env.PAYOS_CANCEL_URL || `http://localhost:${PORT}/payment/cancel`;
const RETURN_URL = process.env.PAYOS_RETURN_URL || `http://localhost:${PORT}/payment/return`;

const headers = {
  "x-client-id": CLIENT_ID,
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

/**
 * Tạo đơn hàng trên PayOS
 */
const createPaymentLink = async (amount) => {
  const orderCode = Date.now();

  const payloadWithSignature = generatePayloadWithSignature(
    orderCode,
    amount,
    "Thanh toán bằng mã QR",
    RETURN_URL,
    CANCEL_URL,
    CHECKSUM_KEY
  );

  const response = await axios.post(
    "https://api-merchant.payos.vn/v2/payment-requests",
    payloadWithSignature,
    { headers }
  );

  if (!response.data || !response.data.data) {
    throw new Error("Dữ liệu trả về không hợp lệ từ PayOS");
  }

  const { checkoutUrl, qrCode } = response.data.data;

  // Tự hủy sau 5 phút nếu chưa thanh toán (Logic đơn giản bằng setTimeout)
  setTimeout(async () => {
    try {
      const statusRes = await axios.get(
        `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`,
        { headers }
      );

      const status = statusRes.data.data?.status;

      if (status !== "PAID") {
        await axios.post(
          `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}/cancel`,
          { "cancellationReason": "Expired" },
          { headers }
        );
        console.log(`❌ Huỷ đơn hàng ${orderCode} sau 5 phút`);
      }
    } catch (e) {
      console.error("Lỗi khi tự động huỷ đơn: ", e.message);
    }
  }, 5 * 60 * 1000);

  return { orderCode, checkoutUrl, qrCode };
};

/**
 * Kiểm tra trạng thái đơn hàng
 */
const getOrderStatus = async (orderCode) => {
  const response = await axios.get(
    `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`,
    { headers }
  );
  return response.data.data.status;
};

/**
 * Xử lý callback từ PayOS
 */
const payosCallback = async (req) => {
  if (!verifySignature(req)) {
    const error = new Error("Chữ ký không hợp lệ");
    error.status = 403;
    throw error;
  }

  const { orderCode, status } = req.body;

  if (status === "PAID") {
    console.log(`💵 Đơn hàng ${orderCode} đã thanh toán thành công!`);
    // 👉 Cập nhật trạng thái vào DB nếu có
  }

  return { message: "Callback nhận thành công" };
};

module.exports = {
  createPaymentLink,
  getOrderStatus,
  payosCallback,
};
const { PayOS } = require("@payos/node");
const { publishPaymentWebhook, publishPaymentSuccess, savePaymentData, getPaymentData, publishPaymentFailed } = require("./event.publisher");
const db = require("../models");
const Payment = db.Payment;
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
  } catch {
    //pass
  }
};

// Gọi setup webhook khi module được load
setupWebhookUrl();

/**
 * Tạo đơn hàng trên PayOS
 */
const createPaymentLink = async (amount, user_id, course_id) => {
  const orderCode = Date.now();
  const body = {
    orderCode: orderCode,
    amount: amount,
    description: "Thanh toán bằng mã QR",
    cancelUrl: CANCEL_URL,
    returnUrl: RETURN_URL,
  };

  const paymentLinkResponse = await payos.paymentRequests.create(body);

  const pendingData = {
    user_id: user_id || 0,
    course_id: course_id || 0,
    amount: amount,
    status: 'pending',
    provider: 'payos',
    provider_order_id: String(orderCode)
  };

  // Lưu payment vào DB ở trạng thái pending khi mới tạo Order
  await savePaymentToDB(pendingData);

  // Khởi tạo payment data trong Redis
  await savePaymentData(orderCode, pendingData);

  // Tự hủy sau 5 phút nếu chưa thanh toán (Logic đơn giản bằng setTimeout)
  setTimeout(async () => {
    try {
      const paymentInfo = await payos.paymentRequests.get(orderCode);
      if (paymentInfo && paymentInfo.status !== "PAID") {
        await payos.paymentRequests.cancel(orderCode, "Expired");
        // update status to failed
        await updatePaymentStatus(orderCode, 'failed');
        // update status in redis
        await savePaymentData(orderCode, { status: 'failed' });
        // publish failed event
        publishPaymentFailed(orderCode, 'Expired');
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
 * Lưu dữ liệu payment vào cơ sở dữ liệu
 */
const savePaymentToDB = async (paymentData) => {
  try {
    const payment = await Payment.create({
      user_id: paymentData.user_id,
      course_id: paymentData.course_id,
      amount: paymentData.amount,
      status: paymentData.status || 'pending',
      provider: paymentData.provider || 'payos',
      provider_order_id: paymentData.provider_order_id,
      created_at: new Date()
    });
    console.log(`✅ Lưu payment vào DB thành công, ID: ${payment.id}`);
    return payment;
  } catch (error) {
    console.error("❌ Lỗi khi lưu payment vào DB:", error.message);
    throw error;
  }
};

/**
 * Cập nhật trạng thái payment trong cơ sở dữ liệu
 */
const updatePaymentStatus = async (provider_order_id, status) => {
  try {
    const updated = await Payment.update(
      { status },
      { where: { provider_order_id: String(provider_order_id) } }
    );
    console.log(`✅ Cập nhật trạng thái payment thành ${status} cho order: ${provider_order_id}`);
    return updated;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái DB:", error.message);
  }
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

      // Lấy data cũ từ Redis để merge với webhookData
      const oldData = await getPaymentData(webhookData.orderCode) || {};
      
      // PayOS dùng field `code` để xác định giao dịch thành công (thường là '00')
      const isSuccess = webhookData.code === '00';
      const updatedData = { 
        ...oldData, 
        ...webhookData, 
        status: isSuccess ? 'paid' : 'failed' 
      };

      // Update payment data vào Redis
      await savePaymentData(webhookData.orderCode, updatedData);

      // 📢 Publish webhook event để các service khác có thể subscribe
      publishPaymentWebhook(updatedData);

      if (isSuccess) {
        // 📢 Publish payment success event
        publishPaymentSuccess(webhookData.orderCode, updatedData);
      } else {
        publishPaymentFailed(webhookData.orderCode, webhookData.desc || 'Thanh toán thất bại');
      }

      // Cập nhật trạng thái DB thành paid hoặc failed
      await updatePaymentStatus(webhookData.orderCode, updatedData.status);

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
  savePaymentToDB,
};
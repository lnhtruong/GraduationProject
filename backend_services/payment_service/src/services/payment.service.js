const { PayOS } = require("@payos/node");
const {
  publishPaymentWebhook,
  publishPaymentSuccess,
  savePaymentData,
  getPaymentData,
  publishPaymentFailed,
} = require("./event.publisher");
const db = require("../models");

const Transaction = db.Transaction;
const TransactionItem = db.TransactionItem;
const Course = db.Course;
require("dotenv").config();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

const PORT = process.env.PORT || 3000;
const CANCEL_URL =
  process.env.PAYOS_CANCEL_URL || `http://localhost:${PORT}/payment/cancel`;
const RETURN_URL =
  process.env.PAYOS_RETURN_URL || `http://localhost:${PORT}/payment/return`;
const WEBHOOK_URL = process.env.PAYOS_WEBHOOK_URL; // Must be a public URL

const setupWebhookUrl = async () => {
  try {
    await payos.webhooks.confirm(WEBHOOK_URL);
    console.log("Webhook registered successfully");
  } catch {
    // pass
  }
};

setupWebhookUrl();

// ============================================================
// CREATE: Tạo đơn thanh toán (1 transaction, nhiều courses)
// ============================================================
/**
 * Create Payment Link (Atomic Transaction)
 * @param {number[]} courseIds - Array of course IDs
 * @param {number} userId - User ID from token
 */
const createPaymentLink = async (courseIds, userId) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw new Error("courseIds phải là mảng và không được rỗng");
  }

  // 1. Fetch course details to get current prices
  const courses = await Course.findAll({
    where: { id: courseIds }
  });

  if (!courses || courses.length === 0) {
    throw new Error("Không tìm thấy thông tin khóa học hợp lệ.");
  }

  // 2. Calculate total amount
  const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

  // Prepare items for local DB snapshot
  const courseItems = courses.map(c => ({
    course_id: c.id,
    price: c.price
  }));

  const orderCode = Date.now();

  const body = {
    orderCode: orderCode,
    amount: totalAmount,
    description: "Thanh toán khóa học",
    cancelUrl: CANCEL_URL,
    returnUrl: RETURN_URL,
  };

  const paymentLinkResponse = await payos.paymentRequests.create(body);

  const pendingData = {
    user_id: userId,
    total_amount: totalAmount,
    status: "pending",
    provider: "payos",
    provider_order_id: String(orderCode),
    courseItems, // [{ course_id, price }]
  };

  // Lưu transaction vào DB ở trạng thái pending
  const savedTransaction = await saveTransactionToDB(pendingData);

  // Lưu data vào Redis (kèm transaction_id để dùng khi callback)
  await savePaymentData(orderCode, {
    ...pendingData,
    transaction_id: savedTransaction.id,
  });

  // Tự hủy sau 5 phút nếu chưa thanh toán
  setTimeout(async () => {
    try {
      const paymentInfo = await payos.paymentRequests.get(orderCode);
      if (paymentInfo && paymentInfo.status !== "PAID") {
        await payos.paymentRequests.cancel(orderCode, "Expired");
        await updateTransactionStatus(orderCode, "failed");
        await savePaymentData(orderCode, { status: "failed" });
        console.log(`❌ Huỷ đơn hàng ${orderCode} sau 5 phút`);
      }
    } catch (e) {
      console.error("Lỗi khi tự động huỷ đơn: ", e.message);
    }
  }, 5 * 60 * 1000);

  return {
    orderCode: paymentLinkResponse.orderCode,
    checkoutUrl: paymentLinkResponse.checkoutUrl,
    qrCode: paymentLinkResponse.qrCode,
    transaction_id: savedTransaction.id,
  };
};

// ============================================================
// CREATE internal: Lưu transaction + items vào DB atomically
// ============================================================
/**
 * @param {{ user_id, total_amount, status, provider, provider_order_id, courseItems }} data
 */
const saveTransactionToDB = async (data) => {
  const t = await db.sequelize.transaction();
  try {
    const transaction = await Transaction.create(
      {
        user_id: data.user_id,
        total_amount: data.total_amount,
        status: data.status || "pending",
        provider: data.provider || "payos",
        provider_order_id: data.provider_order_id,
        created_at: new Date(),
      },
      { transaction: t }
    );

    const items = data.courseItems.map((item) => ({
      transaction_id: transaction.id,
      course_id: item.course_id,
      price: item.price,
    }));

    await TransactionItem.bulkCreate(items, { transaction: t });
    await t.commit();

    console.log(`✅ Lưu transaction vào DB, ID: ${transaction.id}, items: ${items.length}`);
    return transaction;
  } catch (error) {
    await t.rollback();
    console.error("❌ Lỗi khi lưu transaction vào DB:", error.message);
    throw error;
  }
};

// ============================================================
// READ: Lấy danh sách transactions của một user
// ============================================================
const getTransactionsByUser = async (userId) => {
  const transactions = await Transaction.findAll({
    where: { user_id: userId },
    include: [{ model: TransactionItem, as: "items" }],
    order: [["created_at", "DESC"]],
  });
  return transactions;
};

// ============================================================
// READ: Lấy chi tiết một transaction theo ID
// ============================================================
const getTransactionById = async (transactionId) => {
  const transaction = await Transaction.findByPk(transactionId, {
    include: [{ model: TransactionItem, as: "items" }],
  });
  if (!transaction) {
    const err = new Error(`Không tìm thấy transaction ID: ${transactionId}`);
    err.status = 404;
    throw err;
  }
  return transaction;
};

// ============================================================
// UPDATE: Cập nhật trạng thái transaction theo provider_order_id
// ============================================================
const updateTransactionStatus = async (providerOrderId, status) => {
  try {
    const updateData = { status };
    if (status === "paid") {
      updateData.paid_at = new Date();
    }
    const updated = await Transaction.update(updateData, {
      where: { provider_order_id: String(providerOrderId) },
    });
    console.log(
      `✅ Cập nhật trạng thái transaction thành ${status} cho order: ${providerOrderId}`
    );
    return updated;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái:", error.message);
    throw error;
  }
};

// ============================================================
// Kiểm tra trạng thái đơn hàng trên PayOS
// ============================================================
const getOrderStatus = async (orderCode) => {
  const paymentInfo = await payos.paymentRequests.get(orderCode);
  return paymentInfo.status;
};

// ============================================================
// Xử lý webhook callback từ PayOS
// ============================================================
const payosCallback = async (req) => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (webhookData) {
      console.log(`💵 Đơn hàng ${webhookData.orderCode} đã được xử lý`);

      // Lấy data cũ từ Redis (bao gồm transaction_id, course_ids)
      const oldData = (await getPaymentData(webhookData.orderCode)) || {};

      const isSuccess = webhookData.code === "00";
      const updatedData = {
        ...oldData,
        ...webhookData,
        status: isSuccess ? "paid" : "failed",
      };

      // Cập nhật Redis
      await savePaymentData(webhookData.orderCode, updatedData);

      // Cập nhật DB
      await updateTransactionStatus(
        webhookData.orderCode,
        updatedData.status
      );

      // Publish event với course_ids array (breaking change từ course_id cũ)
      publishPaymentWebhook(updatedData);

      if (isSuccess) {
        // payload: { user_id, transaction_id, course_ids: [{ course_id, price }] }
        publishPaymentSuccess(webhookData.orderCode, {
          user_id: oldData.user_id,
          transaction_id: oldData.transaction_id,
          courseItems: oldData.courseItems || [],
        });
      }

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
  saveTransactionToDB,
  getTransactionsByUser,
  getTransactionById,
  updateTransactionStatus,
  getOrderStatus,
  payosCallback,
};
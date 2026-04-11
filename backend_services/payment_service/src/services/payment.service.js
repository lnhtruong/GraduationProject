const { PayOS } = require("@payos/node");
const axios = require("axios");
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

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY,
);

const PORT = process.env.PORT || 3000;
const CANCEL_URL =
  process.env.PAYOS_CANCEL_URL || `http://localhost:${PORT}/payment/cancel`;
const RETURN_URL =
  process.env.PAYOS_RETURN_URL || `http://localhost:${PORT}/payment/return`;
const WEBHOOK_URL = process.env.PAYOS_WEBHOOK_URL;
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || "http://localhost:8008";

const setupWebhookUrl = async () => {
  if (!WEBHOOK_URL) {
    console.warn("⚠️ PAYOS_WEBHOOK_URL chưa được cấu hình, bỏ qua đăng ký webhook");
    return;
  }
  try {
    await payos.webhooks.confirm(WEBHOOK_URL);
    console.log("✅ Webhook đã được đăng ký thành công");
  } catch (err) {
    console.warn("⚠️ Không thể đăng ký webhook PayOS:", err.message);
  }
};

setupWebhookUrl();

// ============================================================
// HELPER: Xóa các course đã mua khỏi giỏ hàng
// ============================================================
const removePurchasedCoursesFromCart = async (userId, courseItems) => {
  if (!userId || !Array.isArray(courseItems) || courseItems.length === 0) return;
  await Promise.allSettled(
    courseItems.map((item) =>
      axios.delete(`${COURSE_SERVICE_URL}/carts/items/${item.course_id}`, {
        headers: { "x-user-id": String(userId) },
      })
    )
  );
};

// ============================================================
// VALIDATE: Kiểm tra courseIds có trong giỏ hàng của user không
// ============================================================
const validateCoursesInCart = async (userId, courseIds) => {
  const response = await axios.get(`${COURSE_SERVICE_URL}/carts`, {
    headers: { "x-user-id": String(userId) },
  });

  const cartItems = response.data?.items ?? [];
  const cartCourseIds = cartItems.map((item) => item.courseId ?? item.course_id);

  const notInCart = courseIds.filter((id) => !cartCourseIds.includes(id));
  if (notInCart.length > 0) {
    const err = new Error(`Khóa học chưa có trong giỏ hàng: ${notInCart.join(", ")}`);
    err.status = 400;
    throw err;
  }
};

// ============================================================
// CREATE: Tạo đơn thanh toán (1 transaction, nhiều courses)
// ============================================================
/**
 * @param {number[]} courseIds
 * @param {number} userId
 */
const createPaymentLink = async (courseIds, userId) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw new Error("courseIds phải là mảng và không được rỗng");
  }

  await validateCoursesInCart(userId, courseIds);

  // Fetch course details
  const courses = await Course.findAll({
    where: { id: courseIds },
  });

  // Validate all requested courseIds were found
  if (courses.length !== courseIds.length) {
    const foundIds = courses.map((c) => c.id);
    const notFound = courseIds.filter((id) => !foundIds.includes(id));
    const err = new Error(`Không tìm thấy khóa học với ID: ${notFound.join(", ")}`);
    err.status = 404;
    throw err;
  }

  // Calculate total amount
  const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

  const courseItems = courses.map((c) => ({
    course_id: c.id,
    price: c.price,
  }));

  const orderCode = Date.now();

  const body = {
    orderCode,
    amount: totalAmount,
    description: "Thanh toan khoa hoc",
    cancelUrl: CANCEL_URL,
    returnUrl: RETURN_URL,
  };

  let paymentLinkResponse;
  try {
    paymentLinkResponse = await payos.paymentRequests.create(body);
  } catch (err) {
    console.warn("⚠️ Không thể tạo link thanh toán PayOS:", err.message);
    paymentLinkResponse = {
      orderCode: orderCode,
      checkoutUrl: null,
      qrCode: null,
    };
  }

  const pendingData = {
    user_id: userId,
    total_amount: totalAmount,
    status: "pending",
    provider: "payos",
    provider_order_id: String(orderCode),
    courseItems,
  };

  // Wrap DB save + Redis in a transaction; cart removal happens after commit
  let savedTransaction;
  const t = await db.sequelize.transaction();
  try {
    savedTransaction = await saveTransactionToDB(pendingData, t);
    await savePaymentData(orderCode, { ...pendingData, transaction_id: savedTransaction.id });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // Remove from cart only after transaction committed
  await removePurchasedCoursesFromCart(userId, courseItems);

  // Auto-cancel after 5 minutes if unpaid
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
// BUY NOW: Mua ngay, không qua giỏ hàng
// ============================================================
const buyNow = async (courseId, userId) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    const err = new Error(`Không tìm thấy khóa học ID: ${courseId}`);
    err.status = 404;
    throw err;
  }

  const totalAmount = course.price;
  const courseItems = [{ course_id: course.id, price: course.price }];
  const orderCode = Date.now();

  let paymentLinkResponse;
  try {
    paymentLinkResponse = await payos.paymentRequests.create({
      orderCode,
      amount: totalAmount,
      description: "Thanh toan khoa hoc",
      cancelUrl: CANCEL_URL,
      returnUrl: RETURN_URL,
    });
  } catch (err) {
    console.warn("⚠️ Không thể tạo link thanh toán PayOS:", err.message);
    paymentLinkResponse = { orderCode, checkoutUrl: null, qrCode: null };
  }

  const pendingData = {
    user_id: userId,
    total_amount: totalAmount,
    status: "pending",
    provider: "payos",
    provider_order_id: String(orderCode),
    courseItems,
  };

  let savedTransaction;
  const t = await db.sequelize.transaction();
  try {
    savedTransaction = await saveTransactionToDB(pendingData, t);
    await savePaymentData(orderCode, { ...pendingData, transaction_id: savedTransaction.id });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

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
// Nếu truyền `t` từ ngoài thì dùng chung, không tự commit/rollback
const saveTransactionToDB = async (data, t = null) => {
  const externalTransaction = t !== null;
  if (!externalTransaction) t = await db.sequelize.transaction();

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

    if (!externalTransaction) await t.commit();

    console.log(`✅ Lưu transaction vào DB, ID: ${transaction.id}, items: ${items.length}`);
    return transaction;
  } catch (error) {
    if (!externalTransaction) await t.rollback();
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
// READ: Lấy chi tiết một transaction (kiểm tra ownership)
// ============================================================
const getTransactionById = async (transactionId, userId) => {
  const transaction = await Transaction.findByPk(transactionId, {
    include: [{ model: TransactionItem, as: "items" }],
  });

  if (!transaction) {
    const err = new Error(`Không tìm thấy transaction ID: ${transactionId}`);
    err.status = 404;
    throw err;
  }

  if (transaction.user_id !== userId) {
    const err = new Error("Không có quyền truy cập transaction này");
    err.status = 403;
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
    console.log(`✅ Cập nhật trạng thái transaction thành ${status} cho order: ${providerOrderId}`);
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
  try {
    const paymentInfo = await payos.paymentRequests.get(orderCode);
    return paymentInfo.status;
  } catch (err) {
    console.warn(`⚠️ Không thể lấy trạng thái đơn hàng ${orderCode} từ PayOS:`, err.message);
    return "PENDING"; // Hoặc trạng thái mặc định phù hợp
  }
};


// ============================================================
// Xử lý webhook callback từ PayOS
// ============================================================
const payosCallback = async (req) => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (webhookData) {
      console.log(`💵 Đơn hàng ${webhookData.orderCode} đã được xử lý`);

      const oldData = (await getPaymentData(webhookData.orderCode)) || {};

      const isSuccess = webhookData.code === "00";
      const updatedData = {
        ...oldData,
        ...webhookData,
        status: isSuccess ? "paid" : "failed",
      };

      await savePaymentData(webhookData.orderCode, updatedData);
      await updateTransactionStatus(webhookData.orderCode, updatedData.status);

      publishPaymentWebhook(updatedData);

      if (isSuccess) {
        publishPaymentSuccess(webhookData.orderCode, {
          user_id: oldData.user_id,
          transaction_id: oldData.transaction_id,
          courseItems: oldData.courseItems || [],
        });

      } else {
        publishPaymentFailed(webhookData.orderCode, webhookData.desc || "Payment failed");
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
  buyNow,
  saveTransactionToDB,
  getTransactionsByUser,
  getTransactionById,
  updateTransactionStatus,
  getOrderStatus,
  payosCallback,
};

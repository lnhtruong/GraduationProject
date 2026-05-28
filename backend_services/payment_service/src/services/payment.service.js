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
const WebhookEvent = db.WebhookEvent;
const sequelize = db.sequelize;
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
const COURSE_SERVICE_URL =
  process.env.COURSE_SERVICE_URL || "http://localhost:8008";

const setupWebhookUrl = async () => {
  if (!WEBHOOK_URL) {
    console.warn(
      "⚠️ PAYOS_WEBHOOK_URL chưa được cấu hình, bỏ qua đăng ký webhook",
    );
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
  if (!userId || !Array.isArray(courseItems) || courseItems.length === 0)
    return;
  await Promise.allSettled(
    courseItems.map((item) =>
      axios.delete(`${COURSE_SERVICE_URL}/carts/items/${item.course_id}`, {
        headers: { "x-user-id": String(userId) },
      }),
    ),
  );
};

// ============================================================
// HELPER: Enroll user vào các khóa học sau khi thanh toán thành công
// ============================================================
const enrollUserInCourses = async (userId, courseItems) => {
  if (!userId || !Array.isArray(courseItems) || courseItems.length === 0)
    return;

  console.log(
    `🚀 Đang tiến hành enroll ${courseItems.length} khóa học cho user ${userId}`,
  );

  await Promise.allSettled(
    courseItems.map((item) =>
      axios
        .post(
          `${COURSE_SERVICE_URL}/enroll`,
          { courseId: item.course_id },
          { headers: { "x-user-id": String(userId) } },
        )
        .then((res) => {
          console.log(`✅ Enroll thành công khóa học ${item.course_id}`);
          return res;
        })
        .catch((err) => {
          console.error(
            `❌ Lỗi enroll khóa học ${item.course_id}:`,
            err.message,
          );
          throw err;
        }),
    ),
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
  const cartCourseIds = cartItems.map(
    (item) => item.courseId ?? item.course_id,
  );

  const notInCart = courseIds.filter((id) => !cartCourseIds.includes(id));
  if (notInCart.length > 0) {
    const err = new Error(
      `Khóa học chưa có trong giỏ hàng: ${notInCart.join(", ")}`,
    );
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

  // Check course tồn tại trước
  const courses = await Course.findAll({
    where: { id: courseIds },
  });

  if (courses.length !== courseIds.length) {
    const foundIds = courses.map((c) => c.id);
    const notFound = courseIds.filter((id) => !foundIds.includes(id));
    const err = new Error(
      `Không tìm thấy khóa học với ID: ${notFound.join(", ")}`,
    );
    err.status = 404;
    throw err;
  }

  const invalidCourses = courses.filter(
    (course) => course.status !== "publish",
  );

  if (invalidCourses.length > 0) {
    const err = new Error(
      `User only can enroll course publish. Invalid IDs: ${invalidCourses.map((c) => c.id).join(", ")}`,
    );
    err.status = 400;
    throw err;
  }

  // Check course service on by get hello
  try {
    const healthRes = await axios.get(`${COURSE_SERVICE_URL}/`);
    if (healthRes.status !== 200) throw new Error();
  } catch {
    const err = new Error(
      "Course service is not available -> Enroll service is not available",
    );
    err.status = 503;
    throw err;
  }

  // Sau đó mới check cart
  await validateCoursesInCart(userId, courseIds);

  // Check if user is already enrolled in any of the courses
  try {
    for (const courseId of courseIds) {
      const enrollCheckRes = await axios.get(
        `${COURSE_SERVICE_URL}/enroll/check-mine-exists`,
        { params: { userId, courseId }, headers: { "x-user-id": String(userId) } },
      );
      if (enrollCheckRes.data?.check) {
        const err = new Error(`User ${userId} is already enrolled in course ${courseId}`);
        err.status = 409;
        throw err;
      }
    }
  } catch (err) {
    if (err.status === 409) throw err;
    console.error("⚠️ Failed to check enrollment status:", err.message);
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
    await savePaymentData(orderCode, {
      ...pendingData,
      transaction_id: savedTransaction.id,
    });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // Auto-cancel after 5 minutes if unpaid
  setTimeout(
    async () => {
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
    },
    5 * 60 * 1000,
  );

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
  // Check course service on by get hello
  try {
    const healthRes = await axios.get(`${COURSE_SERVICE_URL}/`);
    if (healthRes.status !== 200) throw new Error();
  } catch {
    const err = new Error(
      "Course service is not available -> Enroll service is not available",
    );
    err.status = 503;
    throw err;
  }

  const course = await Course.findByPk(courseId);
  if (!course) {
    const err = new Error(`Không tìm thấy khóa học ID: ${courseId}`);
    err.status = 404;
    throw err;
  }
  const courseStatus = course.status || "";
  if (courseStatus !== "publish") {
    const err = new Error(`User only can enroll published course!`);
    err.status = 400;
    throw err;
  }

  // Check if user is already enrolled
  try {
    const enrollCheckRes = await axios.get(
      `${COURSE_SERVICE_URL}/enroll/check-mine-exists`,
      { params: { userId, courseId }, headers: { "x-user-id": String(userId) } },
    );
    if (enrollCheckRes.data?.check) {
      const err = new Error(`User ${userId} is already enrolled in course ${courseId}`);
      err.status = 409;
      throw err;
    }
  } catch (err) {
    if (err.status === 409) throw err;
    console.error("⚠️ Failed to check enrollment status:", err.message);
    throw err;
  }

  // Free course — enroll directly without payment
  if (course.price === 0) {
    const courseItems = [{ course_id: course.id, price: 0 }];
    await enrollUserInCourses(userId, courseItems);
    return { enrolled: true };
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
      cancelUrl: `${CANCEL_URL}?courseId=${courseId}`,
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
    await savePaymentData(orderCode, {
      ...pendingData,
      transaction_id: savedTransaction.id,
    });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  setTimeout(
    async () => {
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
    },
    5 * 60 * 1000,
  );

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
      { transaction: t },
    );

    const items = data.courseItems.map((item) => ({
      transaction_id: transaction.id,
      course_id: item.course_id,
      price: item.price,
    }));

    await TransactionItem.bulkCreate(items, { transaction: t });

    if (!externalTransaction) await t.commit();

    console.log(
      `✅ Lưu transaction vào DB, ID: ${transaction.id}, items: ${items.length}`,
    );
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
const updateTransactionStatus = async (providerOrderId, status, t = null) => {
  try {
    const updateData = { status };
    if (status === "paid") {
      updateData.paid_at = new Date();
    }
    const options = { where: { provider_order_id: String(providerOrderId) } };
    if (t) options.transaction = t;
    const updated = await Transaction.update(updateData, options);
    console.log(
      `✅ Cập nhật trạng thái transaction thành ${status} cho order: ${providerOrderId}`,
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
  // Đọc từ Redis trước — được cập nhật ngay sau webhook
  try {
    const cached = await getPaymentData(orderCode);
    if (cached?.status) {
      const s = cached.status.toUpperCase();
      if (s === "PAID" || s === "FAILED" || s === "CANCELLED") return s;
    }
  } catch (_) {}

  // Fallback: hỏi trực tiếp PayOS
  try {
    const paymentInfo = await payos.paymentRequests.get(orderCode);
    return paymentInfo.status;
  } catch (err) {
    console.warn(
      `⚠️ Không thể lấy trạng thái đơn hàng ${orderCode} từ PayOS:`,
      err.message,
    );
    return "PENDING";
  }
};

// ============================================================
// Xử lý webhook callback từ PayOS
// ============================================================
const payosCallback = async (req) => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (!webhookData) {
      const error = new Error("Chữ ký không hợp lệ");
      error.status = 403;
      throw error;
    }

    // Include event code so different events for the same order aren't deduplicated
    const eventId = `${webhookData.code}_${String(webhookData.orderCode)}`;
    // Exclude raw signature from stored payload
    const { signature: _sig, ...payloadToStore } = req.body || {};

    const isSuccess = webhookData.code === "00";

    // Wrap idempotency gate + DB update atomically:
    // if updateTransactionStatus fails, the WebhookEvent row is rolled back
    // so PayOS can retry and the payment won't be silently lost.
    let created = false;
    try {
      await sequelize.transaction(async (t) => {
        let wasCreated;
        [, wasCreated] = await WebhookEvent.findOrCreate({
          where: { provider: "payos", event_id: eventId },
          defaults: {
            provider: "payos",
            event_id: eventId,
            payload: Object.keys(payloadToStore).length ? payloadToStore : null,
          },
          transaction: t,
        });

        if (!wasCreated) return;

        await updateTransactionStatus(
          webhookData.orderCode,
          isSuccess ? "paid" : "failed",
          t,
        );

        created = true;
      });
    } catch (e) {
      // Concurrent request hit the unique constraint — treat as duplicate
      if (e.name === "SequelizeUniqueConstraintError") {
        console.log(`[payos-callback] duplicate webhook ignored (race): ${eventId}`);
        return { message: "Callback nhận thành công", data: webhookData, duplicate: true };
      }
      throw e;
    }

    if (!created) {
      console.log(`[payos-callback] duplicate webhook ignored: ${eventId}`);
      return { message: "Callback nhận thành công", data: webhookData, duplicate: true };
    }

    console.log(`💵 Đơn hàng ${webhookData.orderCode} đã được xử lý`);

    const oldData = (await getPaymentData(webhookData.orderCode)) || {};
    const updatedData = {
      ...oldData,
      ...webhookData,
      status: isSuccess ? "paid" : "failed",
    };

    await savePaymentData(webhookData.orderCode, updatedData);

    publishPaymentWebhook(updatedData);

    if (isSuccess) {
      publishPaymentSuccess(webhookData.orderCode, {
        user_id: oldData.user_id,
        transaction_id: oldData.transaction_id,
        courseItems: oldData.courseItems || [],
      });

      // Tự động enroll user vào khóa học
      enrollUserInCourses(oldData.user_id, oldData.courseItems || []).catch(
        (err) => {
          console.error("❌ Lỗi tự động enroll sau thanh toán:", err.message);
        },
      );

      // Xoá khỏi giỏ hàng chỉ khi thanh toán thành công
      removePurchasedCoursesFromCart(oldData.user_id, oldData.courseItems || []).catch(
        (err) => {
          console.error("❌ Lỗi xoá cart sau thanh toán:", err.message);
        },
      );
    } else {
      publishPaymentFailed(
        webhookData.orderCode,
        webhookData.desc || "Payment failed",
      );
    }

    return { message: "Callback nhận thành công", data: webhookData };
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

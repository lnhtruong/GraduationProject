const paymentService = require("../services/payment.service");

// ============================================================
// CREATE: Tạo đơn thanh toán cho nhiều courses
// ============================================================
/**
 * POST /payment/create-payment
 * Body: { user_id: number, courseItems: [{course_id, price}], totalAmount: number }
 */
const createPaymentLink = async (req, res) => {
    try {
        const { courseIds } = req.body;
        const userId = req.headers['x-user-id']; // Lấy từ Gateway (Auth Token)

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: Vui lòng đăng nhập" });
        }
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({ error: "courseIds là bắt buộc và phải là mảng" });
        }

        const result = await paymentService.createPaymentLink(courseIds, Number(userId));
        res.json(result);
    } catch (err) {
        console.error("Lỗi khi tạo đơn hàng: ", err.message);
        res.status(500).json({ error: err.message || "Không thể tạo đơn hàng" });
    }
};

// ============================================================
// READ: Lấy danh sách transactions của một user
// ============================================================
/**
 * GET /payment/transactions?user_id=1
 */
const getTransactionsByUser = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.user_id;

        if (!userId) {
            return res.status(400).json({ error: "Thiếu thông tin người dùng (x-user-id or user_id)" });
        }
        const transactions = await paymentService.getTransactionsByUser(
            Number(userId)
        );
        res.json({ data: transactions });
    } catch (err) {
        console.error("Lỗi getTransactionsByUser:", err.message);
        res.status(500).json({ error: "Không thể lấy danh sách transactions" });
    }
};

// ============================================================
// READ: Lấy chi tiết một transaction
// ============================================================
/**
 * GET /payment/transactions/:id
 */
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await paymentService.getTransactionById(Number(id));
        res.json({ data: transaction });
    } catch (err) {
        console.error("Lỗi getTransactionById:", err.message);
        res.status(err.status || 500).json({ error: err.message || "Không thể lấy transaction" });
    }
};

// ============================================================
// READ: Kiểm tra trạng thái đơn hàng trên PayOS
// ============================================================
/**
 * GET /payment/order-status/:orderCode
 */
const getOrderStatus = async (req, res) => {
    const { orderCode } = req.params;
    try {
        const status = await paymentService.getOrderStatus(orderCode);
        res.json({ orderCode, status });
    } catch (err) {
        console.error("Lỗi getOrderStatus:", err.message);
        res.status(500).json({ error: "Không kiểm tra được trạng thái" });
    }
};

// ============================================================
// Webhook callback từ PayOS
// ============================================================
/**
 * POST /payment/payos-callback
 */
const payosCallback = async (req, res) => {
    try {
        console.log("Nhận webhook từ PayOS:", req.body);
        const result = await paymentService.payosCallback(req);
        console.log("✅ Webhook xử lý thành công:", result);
        res.status(200).json(result);
    } catch (err) {
        console.error("❌ Lỗi xử lý webhook:", err.message);
        res.status(err.status || 403).json({
            message: err.message || "Lỗi xử lý callback",
        });
    }
};

module.exports = {
    createPaymentLink,
    getTransactionsByUser,
    getTransactionById,
    getOrderStatus,
    payosCallback,
};

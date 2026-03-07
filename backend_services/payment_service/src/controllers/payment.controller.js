const paymentService = require("../services/payment.service");

// Tạo đơn hàng
const createPaymentLink = async (req, res) => {
    console.log("CHECK createPaymentLink: ", req.body);
    try {
        const { amount } = req.body;
        const result = await paymentService.createPaymentLink(amount || 2222);
        res.json(result);
    } catch (err) {
        console.error("Lỗi khi tạo đơn hàng: ", err.response?.data || err.message);
        res.status(500).json({ error: "Không thể tạo đơn hàng" });
    }
};

// Kiểm tra trạng thái đơn hàng
const getOrderStatus = async (req, res) => {
    const { orderCode } = req.params;
    try {
        const status = await paymentService.getOrderStatus(orderCode);
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: "Không kiểm tra được trạng thái" });
    }
};

// Callback từ PayOS
const payosCallback = async (req, res) => {
    try {
        console.log("Nhận webhook từ PayOS:", req.body);
        const result = await paymentService.payosCallback(req);
        console.log("✅ Webhook xử lý thành công:", result);
        res.status(200).json(result);
    } catch (err) {
        console.error("❌ Lỗi xử lý webhook:", err.message);
        res.status(err.status || 403).json({ message: err.message || "Lỗi xử lý callback" });
    }
};

module.exports = {
    createPaymentLink,
    getOrderStatus,
    payosCallback,
};

const { Router } = require("express");
const {
    createPaymentLink,
    buyNow,
    getTransactionsByUser,
    getTransactionById,
    getOrderStatus,
    payosCallback,
} = require("../controllers");
const { join } = require("path");

const router = Router();

// ── Thanh toán ──────────────────────────────────────────────
// POST  /payment/create-payment
//   body: { user_id, courseItems: [{course_id, price}], totalAmount }
router.post("/create-payment", createPaymentLink);
router.post("/buy-now", buyNow);

// POST  /payment/payos-callback  (webhook từ PayOS)
router.post("/payos-callback", payosCallback);

// GET   /payment/order-status/:orderCode
router.get("/order-status/:orderCode", getOrderStatus);

// ── CRUD Transactions ────────────────────────────────────────
// GET   /payment/transactions?user_id=1
router.get("/transactions", getTransactionsByUser);

// GET   /payment/transactions/:id
router.get("/transactions/:id", getTransactionById);

// ── Redirect pages ───────────────────────────────────────────
router.get("/return", (req, res) => {
    res.sendFile(join(__dirname, "../views/payment_success.html"));
});

router.get("/cancel", (req, res) => {
    res.sendFile(join(__dirname, "../views/payment_cancel.html"));
});

module.exports = router;
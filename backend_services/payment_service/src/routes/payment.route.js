const { Router } = require("express");
const { createPaymentLink, getOrderStatus, payosCallback } = require("../controllers");
const { join } = require("path");

const router = Router();

router.post("/create-payment", createPaymentLink);
router.post("/payos-callback", payosCallback);
router.get("/order-status/:orderCode", getOrderStatus);

router.get("/return", (req, res) => {
    res.sendFile(join(__dirname, "../views/payment_success.html"));
});

router.get("/cancel", (req, res) => {
    res.sendFile(join(__dirname, "../views/payment_cancel.html"));
});

module.exports = router;
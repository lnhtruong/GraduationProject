CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DOUBLE NOT NULL COMMENT 'Tổng tiền của tất cả courses trong đơn',
    status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL DEFAULT 'payos',
    provider_order_id VARCHAR(255) UNIQUE COMMENT 'Mã đơn hàng từ PayOS (orderCode)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME NULL COMMENT 'Thời điểm thanh toán thành công',
    CONSTRAINT fk_transactions_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    course_id INT NOT NULL,
    price DOUBLE NOT NULL COMMENT 'Giá course tại thời điểm mua (snapshot)',
    CONSTRAINT fk_txitems_transaction_id_transactions FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT fk_txitems_course_id_courses FOREIGN KEY (course_id) REFERENCES Courses (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    UNIQUE KEY uq_transaction_course (transaction_id, course_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_transactions_user_id ON transactions (user_id);

CREATE INDEX idx_transactions_provider_order_id ON transactions (provider_order_id);

CREATE INDEX idx_transaction_items_transaction_id ON transaction_items (transaction_id);

CREATE INDEX idx_transaction_items_course_id ON transaction_items (course_id);
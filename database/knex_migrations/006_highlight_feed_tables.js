exports.up = function(knex) {
    return knex.raw(`
        CREATE TABLE \`highlight_feed\` (
            \`id\` INT(11) NOT NULL AUTO_INCREMENT,
            \`video_id\` INT(11) NOT NULL,
            \`course_id\` INT(11) NOT NULL,
            \`title\` VARCHAR(255) NULL,
            \`hashtags\` JSON NULL,
            \`status\` ENUM('active','hidden','removed') DEFAULT 'active',
            \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            INDEX \`idx_highlight_feed_course\` (\`course_id\`),
            INDEX \`idx_highlight_feed_video\` (\`video_id\`),
            CONSTRAINT \`fk_hf_video\` FOREIGN KEY (\`video_id\`)
                REFERENCES \`videos\`(\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_hf_course\` FOREIGN KEY (\`course_id\`)
                REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE \`feed_interactions\` (
            \`id\` INT(11) NOT NULL AUTO_INCREMENT,
            \`user_id\` INT(11) NOT NULL,
            \`highlight_id\` INT(11) NOT NULL,
            \`type\` ENUM('like','save','share') NOT NULL,
            \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`uq_user_highlight_type\` (\`user_id\`, \`highlight_id\`, \`type\`),
            CONSTRAINT \`fk_fi_user\` FOREIGN KEY (\`user_id\`)
                REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_fi_highlight\` FOREIGN KEY (\`highlight_id\`)
                REFERENCES \`highlight_feed\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE \`feed_views\` (
            \`id\` INT(11) NOT NULL AUTO_INCREMENT,
            \`user_id\` INT(11) NOT NULL,
            \`highlight_id\` INT(11) NOT NULL,
            \`watch_duration\` FLOAT NULL,
            \`completed\` BOOLEAN DEFAULT FALSE,
            \`viewed_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            INDEX \`idx_feed_views_user\` (\`user_id\`),
            INDEX \`idx_feed_views_highlight\` (\`highlight_id\`),
            CONSTRAINT \`fk_fv_user\` FOREIGN KEY (\`user_id\`)
                REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
            CONSTRAINT \`fk_fv_highlight\` FOREIGN KEY (\`highlight_id\`)
                REFERENCES \`highlight_feed\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
};

exports.down = function(knex) {
    return knex.raw(`
        DROP TABLE IF EXISTS \`feed_views\`;
        DROP TABLE IF EXISTS \`feed_interactions\`;
        DROP TABLE IF EXISTS \`highlight_feed\`;
    `);
};
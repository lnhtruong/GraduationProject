/**
 * Multi-valued index trên cột `hashtags` của `highlight_feed` để
 * `JSON_CONTAINS(hashtags, JSON_QUOTE(:tag))` chạy nhanh (MySQL 8.0.17+).
 *
 * Tham khảo: https://dev.mysql.com/doc/refman/8.0/en/create-index.html#create-index-multi-valued
 *
 * Nếu phiên bản MySQL < 8.0.17 không hỗ trợ multi-valued index, có thể fallback
 * sang generated column + index thường:
 *
 *     ALTER TABLE highlight_feed
 *       ADD COLUMN hashtags_json_str TEXT
 *         GENERATED ALWAYS AS (CAST(hashtags AS CHAR)) STORED,
 *       ADD INDEX idx_highlight_feed_hashtags_str (hashtags_json_str(255));
 *
 * Approach trên hỗ trợ tìm theo `LIKE '%"tag"%'` (nhanh hơn full table scan)
 * nhưng kém hơn multi-valued index về cardinality.
 */

const INDEX_NAME = 'idx_highlight_feed_hashtags_mv';

exports.up = async function (knex) {
  // Multi-valued index — cần MySQL >= 8.0.17. Quoting `CAST(... AS CHAR(64) ARRAY)`
  // được parser MySQL hỗ trợ; sẽ throw nếu version cũ.
  await knex.raw(`
    ALTER TABLE \`highlight_feed\`
      ADD INDEX \`${INDEX_NAME}\` (
        ( CAST(\`hashtags\` AS CHAR(64) ARRAY) )
      )
  `);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE \`highlight_feed\` DROP INDEX \`${INDEX_NAME}\`;`);
};

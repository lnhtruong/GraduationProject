/**
 * Extends mascot_images for Cloudinary direct uploads (webhook → handleCloudinaryImage).
 * Mirrors database/migrations/mascot_images_cloudinary_columns.sql
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('mascot_images');
  if (!hasTable) return;

  async function addColumnIfMissing(columnName, ddl) {
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'mascot_images' AND column_name = ?`,
      [columnName],
    );
    if (Number(rows?.[0]?.c ?? 0) === 0) {
      await knex.raw(ddl);
    }
  }

  await addColumnIfMissing(
    'job_id',
    `ALTER TABLE mascot_images ADD COLUMN job_id VARCHAR(64) NULL AFTER url`,
  );
  await addColumnIfMissing(
    'thumbnail',
    `ALTER TABLE mascot_images ADD COLUMN thumbnail VARCHAR(1024) NULL AFTER job_id`,
  );
  await addColumnIfMissing(
    'public_id',
    `ALTER TABLE mascot_images ADD COLUMN public_id VARCHAR(512) NULL AFTER thumbnail`,
  );
  await addColumnIfMissing(
    'format',
    `ALTER TABLE mascot_images ADD COLUMN format VARCHAR(32) NULL AFTER public_id`,
  );
  await addColumnIfMissing(
    'name',
    `ALTER TABLE mascot_images ADD COLUMN name VARCHAR(255) NULL AFTER format`,
  );

  const [idx] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'mascot_images' AND index_name = 'uq_mascot_images_job_id'`,
  );
  if (Number(idx?.[0]?.c ?? 0) === 0) {
    await knex.raw(
      `ALTER TABLE mascot_images ADD UNIQUE INDEX uq_mascot_images_job_id (job_id)`,
    );
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('mascot_images');
  if (!hasTable) return;

  try {
    await knex.raw(
      `ALTER TABLE mascot_images DROP INDEX uq_mascot_images_job_id`,
    );
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('check that column/key exists') && !msg.includes("Can't DROP")) {
      throw e;
    }
  }

  const columns = ['name', 'format', 'public_id', 'thumbnail', 'job_id'];
  for (const col of columns) {
    try {
      await knex.raw(`ALTER TABLE mascot_images DROP COLUMN \`${col}\``);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('check that column exists') && !msg.includes('Unknown column')) {
        throw e;
      }
    }
  }
};

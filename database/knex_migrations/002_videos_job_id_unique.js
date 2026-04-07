/**
 * Enforces at most one video row per Cloudinary job_id (video + raw SRT webhooks).
 * Replaces non-unique idx_videos_job_id with UNIQUE uq_videos_job_id.
 * Multiple NULL job_id rows remain allowed (MySQL).
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("videos");
  if (!hasTable) return;

  const [dupes] = await knex.raw(
    `SELECT job_id FROM videos WHERE job_id IS NOT NULL GROUP BY job_id HAVING COUNT(*) > 1 LIMIT 10`,
  );
  if (dupes?.length > 0) {
    throw new Error(
      `[002_videos_job_id_unique] Duplicate job_id rows exist; resolve before migration: ${JSON.stringify(dupes)}`,
    );
  }

  try {
    await knex.raw(`ALTER TABLE videos DROP INDEX idx_videos_job_id`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes("check that column/key exists") && !msg.includes("Can't DROP")) {
      throw e;
    }
  }

  const [hasUq] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'videos' AND index_name = 'uq_videos_job_id'`,
  );
  const c = hasUq?.[0]?.c ?? 0;
  if (Number(c) === 0) {
    await knex.raw(`ALTER TABLE videos ADD UNIQUE INDEX uq_videos_job_id (job_id)`);
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable("videos");
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE videos DROP INDEX uq_videos_job_id`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes("check that column/key exists") && !msg.includes("Can't DROP")) {
      throw e;
    }
  }

  const [hasIdx] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'videos' AND index_name = 'idx_videos_job_id'`,
  );
  const c = hasIdx?.[0]?.c ?? 0;
  if (Number(c) === 0) {
    await knex.raw(`ALTER TABLE videos ADD INDEX idx_videos_job_id (job_id)`);
  }
};

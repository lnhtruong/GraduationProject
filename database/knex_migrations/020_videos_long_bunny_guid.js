/**
 * Adds course "long" video type (Bunny Stream) and optional bunny_video_guid for webhook correlation.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("videos");
  if (!hasTable) return;

  await knex.raw(`
    ALTER TABLE videos
    MODIFY COLUMN type ENUM('highlight', 'mascot', 'long') NOT NULL
  `);

  const [col] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'videos' AND column_name = 'bunny_video_guid'`,
  );
  if (Number(col?.[0]?.c ?? 0) === 0) {
    await knex.raw(`
      ALTER TABLE videos
      ADD COLUMN bunny_video_guid VARCHAR(64) NULL
    `);
  }

  const [idx] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'videos' AND index_name = 'uq_videos_bunny_video_guid'`,
  );
  if (Number(idx?.[0]?.c ?? 0) === 0) {
    await knex.raw(`
      ALTER TABLE videos
      ADD UNIQUE INDEX uq_videos_bunny_video_guid (bunny_video_guid)
    `);
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable("videos");
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE videos DROP INDEX uq_videos_bunny_video_guid`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes("check that column/key exists") && !msg.includes("Can't DROP")) {
      throw e;
    }
  }

  try {
    await knex.raw(`ALTER TABLE videos DROP COLUMN bunny_video_guid`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes("check that column exists") && !msg.includes("Unknown column")) {
      throw e;
    }
  }

  await knex.raw(`
    ALTER TABLE videos
    MODIFY COLUMN type ENUM('highlight', 'mascot') NOT NULL
  `);
};

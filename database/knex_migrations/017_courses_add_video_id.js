/**
 * Adds nullable video_id for course introduction video.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('courses');
  if (!hasTable) return;

  const [videoCol] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'video_id'`,
  );
  if (Number(videoCol?.[0]?.c ?? 0) === 0) {
    await knex.raw(`
      ALTER TABLE courses
      ADD COLUMN video_id INTEGER NULL
    `);
  }

  const [indexCheck] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'courses' AND index_name = 'idx_courses_video_id'`,
  );
  if (Number(indexCheck?.[0]?.c ?? 0) === 0) {
    await knex.raw(`
      ALTER TABLE courses
      ADD INDEX idx_courses_video_id (video_id)
    `);
  }

  const [fkCheck] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = 'courses'
       AND constraint_name = 'fk_courses_video_id' AND constraint_type = 'FOREIGN KEY'`,
  );
  if (Number(fkCheck?.[0]?.c ?? 0) === 0) {
    await knex.raw(`
      ALTER TABLE courses
      ADD CONSTRAINT fk_courses_video_id
      FOREIGN KEY (video_id) REFERENCES videos(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL
    `);
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('courses');
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE courses DROP FOREIGN KEY fk_courses_video_id`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('check that column/key exists') && !msg.includes("Can't DROP")) {
      throw e;
    }
  }

  try {
    await knex.raw(`ALTER TABLE courses DROP INDEX idx_courses_video_id`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('check that column/key exists') && !msg.includes("Can't DROP")) {
      throw e;
    }
  }

  try {
    await knex.raw(`ALTER TABLE courses DROP COLUMN video_id`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('check that column exists') && !msg.includes('Unknown column')) {
      throw e;
    }
  }
};

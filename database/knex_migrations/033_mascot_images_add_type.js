const IMAGE_TYPES = ["thumbnail_video", "thumbnail_course", "avt"];

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("mascot_images");
  if (!hasTable) return;

  const enumSql = `ENUM('${IMAGE_TYPES.join("','")}') NOT NULL DEFAULT 'thumbnail_video'`;
  const hasColumn = await knex.schema.hasColumn("mascot_images", "type");

  if (!hasColumn) {
    await knex.raw(`
      ALTER TABLE mascot_images
      ADD COLUMN \`type\` ${enumSql} AFTER name
    `);
    return;
  }

  await knex.raw(`
    ALTER TABLE mascot_images
    MODIFY COLUMN \`type\` ${enumSql}
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable("mascot_images");
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn("mascot_images", "type");
  if (!hasColumn) return;

  await knex.raw(`
    ALTER TABLE mascot_images
    DROP COLUMN \`type\`
  `);
};

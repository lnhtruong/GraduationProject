const IMAGE_TYPES = [
  'thumbnail_video',
  'thumbnail_course',
  'avt',
  'report',
  'role_upgrade',
  'mascot',
];

const PREVIOUS_IMAGE_TYPES = [
  'thumbnail_video',
  'thumbnail_course',
  'avt',
  'report',
  'role_upgrade',
];

function enumSql(types) {
  return `ENUM('${types.join("','")}') NOT NULL DEFAULT 'thumbnail_video'`;
}

async function hasColumn(knex, tableName, columnName) {
  if (!(await knex.schema.hasTable(tableName))) return false;
  return knex.schema.hasColumn(tableName, columnName);
}

exports.up = async function (knex) {
  const hasMascotImages = await knex.schema.hasTable('mascot_images');
  if (!hasMascotImages) return;

  await knex.raw(`
    ALTER TABLE mascot_images
    MODIFY COLUMN \`type\` ${enumSql(IMAGE_TYPES)}
  `);

  const mascotConditions = [`url LIKE '%/mascot-uploads/%'`];

  if (await hasColumn(knex, 'mascot_images', 'public_id')) {
    mascotConditions.push(`public_id LIKE 'mascot-uploads/%'`);
  }

  if (await hasColumn(knex, 'mascot_overlays', 'image_id')) {
    mascotConditions.push(`image_id IN (
      SELECT DISTINCT image_id
      FROM mascot_overlays
      WHERE image_id IS NOT NULL
    )`);
  }

  if (await hasColumn(knex, 'videos', 'mascot_image_id')) {
    mascotConditions.push(`image_id IN (
      SELECT DISTINCT mascot_image_id
      FROM videos
      WHERE mascot_image_id IS NOT NULL
    )`);
  }

  await knex.raw(`
    UPDATE mascot_images
    SET \`type\` = 'mascot'
    WHERE \`type\` = 'thumbnail_video'
      AND (${mascotConditions.join('\n        OR ')})
  `);
};

exports.down = async function (knex) {
  const hasMascotImages = await knex.schema.hasTable('mascot_images');
  if (!hasMascotImages) return;

  await knex.raw(`
    UPDATE mascot_images
    SET \`type\` = 'thumbnail_video'
    WHERE \`type\` = 'mascot'
  `);

  await knex.raw(`
    ALTER TABLE mascot_images
    MODIFY COLUMN \`type\` ${enumSql(PREVIOUS_IMAGE_TYPES)}
  `);
};
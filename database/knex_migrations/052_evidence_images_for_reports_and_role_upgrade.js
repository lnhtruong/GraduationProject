const IMAGE_TYPES = [
  'thumbnail_video',
  'thumbnail_course',
  'avt',
  'report',
  'role_upgrade',
];

exports.up = async function (knex) {
  const imageTypeSql = `ENUM('${IMAGE_TYPES.join("','")}') NOT NULL DEFAULT 'thumbnail_video'`;

  await knex.raw(`
    ALTER TABLE mascot_images
    MODIFY COLUMN \`type\` ${imageTypeSql}
  `);

  const reportHasEvidence = await knex.schema.hasColumn('reports', 'evidence_image_ids');
  if (!reportHasEvidence) {
    await knex.raw(`
      ALTER TABLE reports
      ADD COLUMN evidence_image_ids JSON NULL AFTER reason
    `);
  }

  const requestHasEvidence = await knex.schema.hasColumn(
    'lecturer_upgrade_requests',
    'evidence_image_ids',
  );
  if (!requestHasEvidence) {
    await knex.raw(`
      ALTER TABLE lecturer_upgrade_requests
      ADD COLUMN evidence_image_ids JSON NULL AFTER confirm
    `);
  }
};

exports.down = async function (knex) {
  const hasEvidenceImages = await knex('mascot_images')
    .whereIn('type', ['report', 'role_upgrade'])
    .first();
  if (hasEvidenceImages) {
    throw new Error(
      'Cannot rollback migration 052 while report/role_upgrade images still exist.',
    );
  }

  const reportHasEvidence = await knex.schema.hasColumn('reports', 'evidence_image_ids');
  if (reportHasEvidence) {
    await knex.raw('ALTER TABLE reports DROP COLUMN evidence_image_ids');
  }

  const requestHasEvidence = await knex.schema.hasColumn(
    'lecturer_upgrade_requests',
    'evidence_image_ids',
  );
  if (requestHasEvidence) {
    await knex.raw(
      'ALTER TABLE lecturer_upgrade_requests DROP COLUMN evidence_image_ids',
    );
  }

  await knex.raw(`
    ALTER TABLE mascot_images
    MODIFY COLUMN \`type\` ENUM('thumbnail_video', 'thumbnail_course', 'avt')
      NOT NULL DEFAULT 'thumbnail_video'
  `);
};

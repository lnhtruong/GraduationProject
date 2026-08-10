/**
 * Videos: link a highlight video back to the source video it was generated
 * from, and a guard against starting a second segment-removal edit while
 * one is already in flight.
 *
 * original_video_id: self-referential FK to videos.id. Nullable — highlights
 * created before this feature (or via a flow that never resolved a source
 * video_id) simply have no link, and the segment-removal feature is
 * unavailable for them. ON DELETE SET NULL: if the source video is later
 * deleted, the highlight itself should still exist, just no longer editable.
 *
 * editing_job_id: set to the in-flight edit job's id when an edit starts,
 * cleared by that job's completion/failure webhook. Kept separate from the
 * existing job_id column, which already means "the creation job" and is
 * used for job_id-based upsert elsewhere.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('videos');
  if (!hasTable) return;

  const hasOriginalVideoId = await knex.schema.hasColumn('videos', 'original_video_id');
  const hasEditingJobId = await knex.schema.hasColumn('videos', 'editing_job_id');

  if (!hasOriginalVideoId) {
    await knex.schema.alterTable('videos', (table) => {
      table.integer('original_video_id').nullable().after('srt_raw_url');
    });
    await knex.schema.alterTable('videos', (table) => {
      table
        .foreign('original_video_id', 'fk_videos_original_video_id')
        .references('id')
        .inTable('videos')
        .onDelete('SET NULL');
    });
  }

  if (!hasEditingJobId) {
    await knex.schema.alterTable('videos', (table) => {
      table.string('editing_job_id', 191).nullable().after('original_video_id');
    });
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('videos');
  if (!hasTable) return;

  const hasEditingJobId = await knex.schema.hasColumn('videos', 'editing_job_id');
  if (hasEditingJobId) {
    await knex.schema.alterTable('videos', (table) => {
      table.dropColumn('editing_job_id');
    });
  }

  const hasOriginalVideoId = await knex.schema.hasColumn('videos', 'original_video_id');
  if (hasOriginalVideoId) {
    await knex.schema.alterTable('videos', (table) => {
      table.dropForeign('original_video_id', 'fk_videos_original_video_id');
    });
    await knex.schema.alterTable('videos', (table) => {
      table.dropColumn('original_video_id');
    });
  }
};

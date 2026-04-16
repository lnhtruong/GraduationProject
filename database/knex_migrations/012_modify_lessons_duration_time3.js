exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE courses
    MODIFY COLUMN duration TIME(3) NULL;
  `);

  await knex.raw(`
    ALTER TABLE lessons
    MODIFY COLUMN duration TIME(3) NULL;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE courses
    MODIFY COLUMN duration TIME NOT NULL;
  `);

  await knex.raw(`
    ALTER TABLE lessons
    MODIFY COLUMN duration FLOAT NULL;
  `);
};

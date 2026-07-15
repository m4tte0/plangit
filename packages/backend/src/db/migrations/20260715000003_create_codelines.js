export async function up(knex) {
  await knex.schema.createTable('codelines', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('name').notNullable();
    table
      .uuid('parent_codeline_id')
      .references('id')
      .inTable('codelines')
      .onDelete('SET NULL');
    table.date('branch_point_date');
    table.text('color');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('codelines');
}

export async function up(knex) {
  await knex.schema.createTable('milestones', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('name').notNullable();
    table.date('target_date');
    table.text('description');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('milestones');
}

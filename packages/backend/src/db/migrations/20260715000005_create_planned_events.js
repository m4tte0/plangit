export async function up(knex) {
  await knex.schema.createTable('planned_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .enu('type', ['BRANCH_CREATE', 'MERGE', 'RELEASE_TAG'], {
        useNative: true,
        enumName: 'planned_event_type',
      })
      .notNullable();
    table
      .uuid('source_codeline_id')
      .references('id')
      .inTable('codelines')
      .onDelete('CASCADE');
    table
      .uuid('target_codeline_id')
      .references('id')
      .inTable('codelines')
      .onDelete('CASCADE');
    table.date('planned_date').notNullable();
    table
      .enu('status', ['planned', 'in_progress', 'done', 'slipped'], {
        useNative: true,
        enumName: 'plan_item_status',
        existingType: true,
      })
      .notNullable()
      .defaultTo('planned');
    table
      .uuid('milestone_id')
      .references('id')
      .inTable('milestones')
      .onDelete('SET NULL');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('planned_events');
  await knex.raw('DROP TYPE IF EXISTS planned_event_type');
}

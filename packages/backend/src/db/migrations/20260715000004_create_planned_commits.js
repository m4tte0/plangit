export async function up(knex) {
  await knex.schema.createTable('planned_commits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('codeline_id')
      .notNullable()
      .references('id')
      .inTable('codelines')
      .onDelete('CASCADE');
    table.text('title').notNullable();
    table.text('description');
    table.date('planned_date').notNullable();
    table
      .enu('status', ['planned', 'in_progress', 'done', 'slipped'], {
        useNative: true,
        enumName: 'plan_item_status',
      })
      .notNullable()
      .defaultTo('planned');
    // Nullable — set once reconciliation (phase 2) matches this to a real commit.
    table.text('linked_real_revision');
    table.specificType('assignee_ids', 'uuid[]').notNullable().defaultTo('{}');
    table
      .uuid('milestone_id')
      .references('id')
      .inTable('milestones')
      .onDelete('SET NULL');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('planned_commits');
  await knex.raw('DROP TYPE IF EXISTS plan_item_status');
}

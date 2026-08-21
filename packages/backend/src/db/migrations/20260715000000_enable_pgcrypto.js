// gen_random_uuid() is core-builtin on Postgres 13+, but every table's id
// column relies on it via DEFAULT -- pgcrypto provides the same function on
// older Postgres versions (and installs harmlessly alongside the built-in
// on 13+), so id generation on INSERT works regardless of server version.
export async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');
}

export async function down(knex) {
  await knex.raw('DROP EXTENSION IF EXISTS pgcrypto');
}

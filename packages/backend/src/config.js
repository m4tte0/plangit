export const config = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL || 'postgres://plangit:plangit@localhost:5432/plangit',
};

import express from 'express';
import { codelineRouter } from './domain/codeline/codeline.routes.js';
import { plannedCommitRouter } from './domain/planned-commit/planned-commit.routes.js';
import { plannedEventRouter } from './domain/planned-event/planned-event.routes.js';
import { milestoneRouter } from './domain/milestone/milestone.routes.js';
import { teamMemberRouter } from './domain/team-member/team-member.routes.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/codelines', codelineRouter);
  app.use('/api/planned-commits', plannedCommitRouter);
  app.use('/api/planned-events', plannedEventRouter);
  app.use('/api/milestones', milestoneRouter);
  app.use('/api/team-members', teamMemberRouter);

  app.use(errorHandler);

  return app;
}

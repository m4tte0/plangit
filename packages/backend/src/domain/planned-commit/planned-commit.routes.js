import { Router } from 'express';
import * as service from './planned-commit.service.js';

export const plannedCommitRouter = Router();

plannedCommitRouter.get('/', async (req, res, next) => {
  try {
    res.json(await service.list());
  } catch (err) {
    next(err);
  }
});

plannedCommitRouter.get('/:id', async (req, res, next) => {
  try {
    res.json(await service.get(req.params.id));
  } catch (err) {
    next(err);
  }
});

plannedCommitRouter.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    next(err);
  }
});

plannedCommitRouter.patch('/:id', async (req, res, next) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

plannedCommitRouter.delete('/:id', async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

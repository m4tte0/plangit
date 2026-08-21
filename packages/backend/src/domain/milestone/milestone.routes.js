import { Router } from 'express';
import * as service from './milestone.service.js';

export const milestoneRouter = Router();

milestoneRouter.get('/', async (req, res, next) => {
  try {
    res.json(await service.list());
  } catch (err) {
    next(err);
  }
});

milestoneRouter.get('/:id', async (req, res, next) => {
  try {
    res.json(await service.get(req.params.id));
  } catch (err) {
    next(err);
  }
});

milestoneRouter.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    next(err);
  }
});

milestoneRouter.patch('/:id', async (req, res, next) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

milestoneRouter.delete('/:id', async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

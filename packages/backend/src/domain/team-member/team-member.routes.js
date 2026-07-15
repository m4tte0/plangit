import { Router } from 'express';
import * as service from './team-member.service.js';

export const teamMemberRouter = Router();

teamMemberRouter.get('/', async (req, res, next) => {
  try {
    res.json(await service.list());
  } catch (err) {
    next(err);
  }
});

teamMemberRouter.get('/:id', async (req, res, next) => {
  try {
    res.json(await service.get(req.params.id));
  } catch (err) {
    next(err);
  }
});

teamMemberRouter.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    next(err);
  }
});

teamMemberRouter.patch('/:id', async (req, res, next) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

teamMemberRouter.delete('/:id', async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

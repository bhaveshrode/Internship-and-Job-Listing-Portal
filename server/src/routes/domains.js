import { Router } from 'express';
import Opportunity from '../models/Opportunity.js';

const router = Router();

// GET /api/domains — distinct domains for the filter dropdown
router.get('/', async (_req, res, next) => {
  try {
    const domains = await Opportunity.distinct('domain');
    res.json(domains.sort());
  } catch (err) {
    next(err);
  }
});

export default router;

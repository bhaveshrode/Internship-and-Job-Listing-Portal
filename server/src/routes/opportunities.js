import { Router } from 'express';
import Opportunity from '../models/Opportunity.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/opportunities?search=&domain=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { search, domain } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const filter = {};
    if (domain) filter.domain = domain;
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { company: regex }];
    }

    const [items, total] = await Promise.all([
      Opportunity.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Opportunity.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities/:id
router.get('/:id', async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opportunity);
  } catch (err) {
    next(err);
  }
});

// POST /api/opportunities (admin)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const opportunity = await Opportunity.create(req.body);
    res.status(201).json(opportunity);
  } catch (err) {
    next(err);
  }
});

// PUT /api/opportunities/:id (admin)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opportunity);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/opportunities/:id (admin)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json({ message: 'Opportunity deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;

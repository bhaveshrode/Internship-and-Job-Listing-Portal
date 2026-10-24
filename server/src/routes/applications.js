import { Router } from 'express';
import Application from '../models/Application.js';
import Opportunity from '../models/Opportunity.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/applications (public)
router.post('/', async (req, res, next) => {
  try {
    const { opportunityId, name, email, phone, coverNote } = req.body;
    if (!opportunityId || !name || !email || !phone) {
      return res
        .status(400)
        .json({ message: 'opportunityId, name, email and phone are required' });
    }
    if (name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ message: 'Name must be 2-100 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (!/^[+\d][\d\s-]{6,14}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Please provide a valid phone number' });
    }
    if (coverNote && coverNote.length > 2000) {
      return res.status(400).json({ message: 'Cover note must be under 2000 characters' });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const application = await Application.create({
      opportunity: opportunityId,
      name,
      email,
      phone,
      coverNote,
    });
    res.status(201).json({ message: 'Application submitted', application });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications?opportunityId= (admin)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.opportunityId) filter.opportunity = req.query.opportunityId;
    const applications = await Application.find(filter)
      .populate('opportunity', 'title company')
      .sort({ submittedAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

export default router;

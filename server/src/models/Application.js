import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  coverNote: { type: String, trim: true },
  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Application', applicationSchema);

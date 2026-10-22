import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    applicationLink: { type: String, trim: true },
  },
  { timestamps: true }
);

opportunitySchema.index({ title: 'text', company: 'text' });

export default mongoose.model('Opportunity', opportunitySchema);

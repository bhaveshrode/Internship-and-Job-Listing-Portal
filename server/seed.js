import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './src/config/db.js';
import Opportunity from './src/models/Opportunity.js';
import Admin from './src/models/Admin.js';

const opportunities = [
  {
    title: 'Frontend Developer Intern',
    company: 'PixelForge Labs',
    domain: 'Web Development',
    location: 'Remote',
    experience: 'Fresher',
    description:
      'Build responsive user interfaces with React.js. Work closely with designers to implement pixel-perfect layouts and interactive components.',
    applicationLink: 'https://example.com/apply/frontend-intern',
  },
  {
    title: 'Data Science Intern',
    company: 'Insight Analytics',
    domain: 'Data Science',
    location: 'Bengaluru',
    experience: '0-1 years',
    description:
      'Analyze large datasets, build predictive models, and create dashboards using Python, pandas, and scikit-learn.',
    applicationLink: 'https://example.com/apply/data-intern',
  },
  {
    title: 'Marketing Intern',
    company: 'GrowthWave',
    domain: 'Marketing',
    location: 'Hyderabad',
    experience: 'Fresher',
    description:
      'Support digital marketing campaigns, manage social media channels, and analyze campaign performance metrics.',
    applicationLink: 'https://example.com/apply/marketing-intern',
  },
  {
    title: 'Node.js Backend Intern',
    company: 'CloudBridge Systems',
    domain: 'Web Development',
    location: 'Remote',
    experience: '0-2 years',
    description:
      'Develop REST APIs with Node.js and Express, work with MongoDB, and learn about authentication and deployment.',
    applicationLink: 'https://example.com/apply/backend-intern',
  },
  {
    title: 'UI/UX Design Intern',
    company: 'DesignHive Studio',
    domain: 'Design',
    location: 'Pune',
    experience: 'Fresher',
    description:
      'Create wireframes, prototypes, and visual designs for web and mobile apps using Figma. Collaborate with developers on handoff.',
    applicationLink: 'https://example.com/apply/design-intern',
  },
];

async function seed() {
  await connectDB();

  const existingAdmin = await Admin.findOne({ username: 'admin' });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await Admin.create({ username: process.env.ADMIN_USERNAME || 'admin', passwordHash });
    console.log('Seeded admin user');
  } else {
    console.log('Admin user already exists, skipping');
  }

  const count = await Opportunity.countDocuments();
  if (count === 0) {
    await Opportunity.insertMany(opportunities);
    console.log(`Seeded ${opportunities.length} opportunities`);
  } else {
    console.log('Opportunities already exist, skipping');
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

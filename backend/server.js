const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const dashboardRoutes = require('./routes/dashboard');
const activityRoutes = require('./routes/activities');

// Seed on start
const User = require('./models/User');
const Employee = require('./models/Employee');
const Department = require('./models/Department');

const app = express();

// Ensure logs and uploads dirs exist
['logs', 'uploads'].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts, please try again later.' } });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan via Winston
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// Static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activityRoutes);

// Health
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date(), version: '2.0.0' }));

// Error handling
app.use(notFound);
app.use(errorHandler);

// DB Connect + Auto Seed
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected');

    // Auto-seed
    const adminExists = await User.findOne({ email: 'admin@company.com' });
    if (!adminExists) {
      await User.create({ name: 'Super Admin', email: 'admin@company.com', password: 'Admin@123', role: 'admin', isActive: true });
      logger.info('Admin seeded: admin@company.com / Admin@123');
    }
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      const DEPARTMENTS = [
        { name: 'Engineering', code: 'ENG', description: 'Software development', color: '#6366f1', location: 'Floor 3' },
        { name: 'Design', code: 'DES', description: 'UI/UX design', color: '#ec4899', location: 'Floor 2' },
        { name: 'HR', code: 'HR', description: 'Human Resources', color: '#10b981', location: 'Floor 1' },
        { name: 'Marketing', code: 'MKT', description: 'Brand marketing', color: '#f59e0b', location: 'Floor 2' },
        { name: 'Finance', code: 'FIN', description: 'Financial planning', color: '#3b82f6', location: 'Floor 4' },
        { name: 'Sales', code: 'SAL', description: 'Revenue growth', color: '#ef4444', location: 'Floor 1' },
        { name: 'Product', code: 'PRD', description: 'Product strategy', color: '#8b5cf6', location: 'Floor 3' },
        { name: 'Operations', code: 'OPS', description: 'Business operations', color: '#06b6d4', location: 'Floor 4' }
      ];
      await Department.insertMany(DEPARTMENTS);
      logger.info('8 departments seeded');
    }
    const empCount = await Employee.countDocuments();
    if (empCount === 0) {
      const EMPLOYEES = [
        { firstName: 'Alice', lastName: 'Johnson', email: 'alice@company.com', phone: '+1-555-0101', department: 'Engineering', role: 'Senior Developer', salary: 95000, joiningDate: new Date('2022-01-15'), status: 'Active', employmentType: 'Full-time', skills: ['React', 'Node.js', 'MongoDB'] },
        { firstName: 'Bob', lastName: 'Smith', email: 'bob@company.com', phone: '+1-555-0102', department: 'Design', role: 'UI/UX Designer', salary: 75000, joiningDate: new Date('2022-03-10'), status: 'Active', employmentType: 'Full-time', skills: ['Figma', 'Adobe XD'] },
        { firstName: 'Carol', lastName: 'White', email: 'carol@company.com', phone: '+1-555-0103', department: 'HR', role: 'HR Manager', salary: 80000, joiningDate: new Date('2021-07-20'), status: 'Active', employmentType: 'Full-time', skills: ['Recruitment', 'Payroll'] },
        { firstName: 'David', lastName: 'Brown', email: 'david@company.com', phone: '+1-555-0104', department: 'Marketing', role: 'Marketing Specialist', salary: 78000, joiningDate: new Date('2022-05-01'), status: 'On Leave', employmentType: 'Full-time', skills: ['SEO', 'Content'] },
        { firstName: 'Emma', lastName: 'Davis', email: 'emma@company.com', phone: '+1-555-0105', department: 'Finance', role: 'Financial Analyst', salary: 72000, joiningDate: new Date('2023-01-10'), status: 'Active', employmentType: 'Full-time', skills: ['Excel', 'Modeling'] },
        { firstName: 'Frank', lastName: 'Miller', email: 'frank@company.com', phone: '+1-555-0106', department: 'Sales', role: 'Sales Executive', salary: 65000, joiningDate: new Date('2023-04-15'), status: 'Active', employmentType: 'Full-time', skills: ['CRM', 'Negotiation'] },
        { firstName: 'Grace', lastName: 'Wilson', email: 'grace@company.com', phone: '+1-555-0107', department: 'Product', role: 'Product Manager', salary: 105000, joiningDate: new Date('2021-11-01'), status: 'Active', employmentType: 'Full-time', skills: ['Roadmapping', 'Agile'] },
        { firstName: 'Henry', lastName: 'Moore', email: 'henry@company.com', phone: '+1-555-0108', department: 'Engineering', role: 'Backend Developer', salary: 90000, joiningDate: new Date('2022-08-20'), status: 'Active', employmentType: 'Full-time', skills: ['Python', 'AWS'] },
        { firstName: 'Ivy', lastName: 'Taylor', email: 'ivy@company.com', phone: '+1-555-0109', department: 'Engineering', role: 'QA Engineer', salary: 55000, joiningDate: new Date('2023-06-01'), status: 'Active', employmentType: 'Contract', skills: ['Selenium', 'Jest'] },
        { firstName: 'Jack', lastName: 'Anderson', email: 'jack@company.com', phone: '+1-555-0110', department: 'Operations', role: 'Operations Manager', salary: 88000, joiningDate: new Date('2022-02-14'), status: 'Inactive', employmentType: 'Full-time', skills: ['Logistics'] }
      ];
      for (const e of EMPLOYEES) { e.name = `${e.firstName} ${e.lastName}`; await Employee.create(e); }
      logger.info('10 employees seeded');
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => logger.info(`🚀 EmpAxis server running on port ${PORT}`));
  } catch (err) {
    logger.error('Server startup failed:', err);
    process.exit(1);
  }
}

startServer();

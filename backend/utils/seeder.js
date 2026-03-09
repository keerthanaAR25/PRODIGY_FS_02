const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG', description: 'Software development and architecture', color: '#6366f1', location: 'Floor 3' },
  { name: 'Design', code: 'DES', description: 'UI/UX and visual design', color: '#ec4899', location: 'Floor 2' },
  { name: 'HR', code: 'HR', description: 'Human Resources and talent acquisition', color: '#10b981', location: 'Floor 1' },
  { name: 'Marketing', code: 'MKT', description: 'Brand and growth marketing', color: '#f59e0b', location: 'Floor 2' },
  { name: 'Finance', code: 'FIN', description: 'Financial planning and accounting', color: '#3b82f6', location: 'Floor 4' },
  { name: 'Sales', code: 'SAL', description: 'Revenue and business development', color: '#ef4444', location: 'Floor 1' },
  { name: 'Product', code: 'PRD', description: 'Product management and strategy', color: '#8b5cf6', location: 'Floor 3' },
  { name: 'Operations', code: 'OPS', description: 'Business operations and logistics', color: '#06b6d4', location: 'Floor 4' }
];

const EMPLOYEES = [
  { firstName: 'Alice', lastName: 'Johnson', email: 'alice@company.com', phone: '+1-555-0101', department: 'Engineering', role: 'Senior Developer', salary: 95000, joiningDate: new Date('2022-01-15'), status: 'Active', employmentType: 'Full-time', skills: ['React', 'Node.js', 'MongoDB'] },
  { firstName: 'Bob', lastName: 'Smith', email: 'bob@company.com', phone: '+1-555-0102', department: 'Design', role: 'UI/UX Designer', salary: 75000, joiningDate: new Date('2022-03-10'), status: 'Active', employmentType: 'Full-time', skills: ['Figma', 'Adobe XD'] },
  { firstName: 'Carol', lastName: 'White', email: 'carol@company.com', phone: '+1-555-0103', department: 'HR', role: 'HR Manager', salary: 80000, joiningDate: new Date('2021-07-20'), status: 'Active', employmentType: 'Full-time', skills: ['Recruitment', 'Payroll'] },
  { firstName: 'David', lastName: 'Brown', email: 'david@company.com', phone: '+1-555-0104', department: 'Marketing', role: 'Marketing Specialist', salary: 78000, joiningDate: new Date('2022-05-01'), status: 'On Leave', employmentType: 'Full-time', skills: ['SEO', 'Content Writing'] },
  { firstName: 'Emma', lastName: 'Davis', email: 'emma@company.com', phone: '+1-555-0105', department: 'Finance', role: 'Financial Analyst', salary: 72000, joiningDate: new Date('2023-01-10'), status: 'Active', employmentType: 'Full-time', skills: ['Excel', 'Financial Modeling'] },
  { firstName: 'Frank', lastName: 'Miller', email: 'frank@company.com', phone: '+1-555-0106', department: 'Sales', role: 'Sales Executive', salary: 65000, joiningDate: new Date('2023-04-15'), status: 'Active', employmentType: 'Full-time', skills: ['CRM', 'Negotiation'] },
  { firstName: 'Grace', lastName: 'Wilson', email: 'grace@company.com', phone: '+1-555-0107', department: 'Product', role: 'Product Manager', salary: 105000, joiningDate: new Date('2021-11-01'), status: 'Active', employmentType: 'Full-time', skills: ['Roadmapping', 'Agile', 'Jira'] },
  { firstName: 'Henry', lastName: 'Moore', email: 'henry@company.com', phone: '+1-555-0108', department: 'Engineering', role: 'Backend Developer', salary: 90000, joiningDate: new Date('2022-08-20'), status: 'Active', employmentType: 'Full-time', skills: ['Python', 'AWS', 'Docker'] },
  { firstName: 'Ivy', lastName: 'Taylor', email: 'ivy@company.com', phone: '+1-555-0109', department: 'Engineering', role: 'QA Engineer', salary: 55000, joiningDate: new Date('2023-06-01'), status: 'Active', employmentType: 'Contract', skills: ['Selenium', 'Jest'] },
  { firstName: 'Jack', lastName: 'Anderson', email: 'jack@company.com', phone: '+1-555-0110', department: 'Operations', role: 'Operations Manager', salary: 88000, joiningDate: new Date('2022-02-14'), status: 'Inactive', employmentType: 'Full-time', skills: ['Logistics', 'Supply Chain'] }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: 'admin@company.com' });
    if (!existingAdmin) {
      await User.create({ name: 'Super Admin', email: 'admin@company.com', password: 'Admin@123', role: 'admin', isActive: true });
      console.log('✅ Admin created: admin@company.com / Admin@123');
    }

    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      await Department.insertMany(DEPARTMENTS);
      console.log(`✅ ${DEPARTMENTS.length} departments created`);
    }

    const empCount = await Employee.countDocuments();
    if (empCount === 0) {
      for (const e of EMPLOYEES) {
        e.name = `${e.firstName} ${e.lastName}`;
        await Employee.create(e);
      }
      console.log(`✅ ${EMPLOYEES.length} employees created`);
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();

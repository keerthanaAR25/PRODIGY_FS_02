📊 EmpAxis Pro — Employee Management System
-----------
A production-style Full-Stack Employee Management System built using the MERN Stack that enables organizations to efficiently manage employees, departments, analytics, and activity logs through a modern admin dashboard.

The platform simulates a real enterprise HR management solution with authentication, role-based access control, and analytics visualization.

🚀 Features
---------
👨‍💼 Employee Management

Create employee profiles with full details

View all employees with advanced table view

Update employee information

Soft delete employees with Trash recovery

Employee search, filtering, and sorting

🏢 Department Management

Create departments

Edit department information

Assign employees to departments

Department analytics overview

📊 Analytics Dashboard

Total employee statistics

Active vs inactive employees

Department distribution

Hiring trend visualization

Average salary per department

📂 Data Import & Export

Export employee data as:

CSV

Excel

JSON

Import employee records via CSV

🗑 Trash & Recovery System

Soft delete employees

Restore deleted records

Permanent deletion option

📝 Activity Logs

Track important system actions including:

Login attempts

Password changes

Department updates

Profile changes

This helps maintain audit history for security monitoring.

🔐 Authentication & Security

JWT Authentication

Password hashing with bcrypt

Role-based access control

Secure login sessions

OTP verification support

Login history tracking

⚙ Profile Management

Users can:

Update profile information

Change password securely

Enable 2FA authentication

Track login sessions

🎨 UI / UX Features

Modern enterprise dashboard layout

Interactive analytics charts

Animated UI components

Dark / Light theme toggle

Responsive sidebar navigation

Clean card-based interface

🛠 Tech Stack
Frontend

React

Vite

Chart.js / Recharts

Framer Motion

Backend

Node.js

Express.js

Database

MongoDB

Mongoose

Authentication

JWT

bcrypt

📂 Project Structure
empaxis-pro
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── middleware
│   └── server.js
│
├── frontend
│   ├── components
│   ├── pages
│   ├── context
│   └── App.js

⚙ Installation and Running
cd backend
-----
npm install
------
npm run dev
-----
cd frontend
------
npm install react-scripts@5.0.1 --save --legacy-peer-deps
-----
npm install react@18.2.0 react-dom@18.2.0 react-router-dom@6.20.0 axios@1.6.2 framer-motion@10.16.5 chart.js@4.4.0 react-chartjs-2@5.2.0 react-hot-toast@2.4.1 date-fns@2.30.0 lucide-react@0.294.0 --save --legacy-peer-deps
------
npm install ajv@^8.0.0 --save --legacy-peer-deps
-----
npm start

📊 Key Learning Outcomes
-------

This project helped strengthen my understanding of:

Full-stack MERN architecture

Authentication & security workflows

Data visualization dashboards

CRUD application development

Enterprise UI design


# 🚀 EmpAxis Pro
Enterprise Employee Management (Full-Stack)

A **production-ready Employee Management System** built with the **MERN stack** that enables administrators to manage employees, departments, analytics, and audit logs securely.

This application provides a **complete HR management workflow** including employee CRUD operations, department tracking, analytics dashboards, and security features like authentication and role-based access.

---

# ✨ Features

## 🔐 Security

* JWT Authentication (Access + Refresh Tokens)
* bcrypt password hashing
* Account lockout after **5 failed login attempts**
* Rate limiting protection
* Helmet security headers
* Two-Factor Authentication (OTP)
* Role-based access control

Roles:

* Admin
* Manager
* HR
* Employee

---

# 👥 Employee Lifecycle Management

* Auto-generated employee IDs (EMP00001...)
* Profile picture upload
* Soft delete system
* Trash management
* Restore deleted employees
* Permanent deletion option
* Skills tagging
* Admin internal notes
* Employee status history

---

# 📊 Analytics Dashboard

Interactive dashboard built using **Chart.js**

Includes:

* Department distribution chart
* Employee status chart
* Salary analytics
* Hiring trends over **12 months**

Additional dashboard features:

* Animated statistic counters
* Quick action cards
* Recent activity feed

---

# ⚡ Power Features

* Bulk employee deletion

* Bulk updates

* CSV import

* Export to:

  * CSV
  * Excel
  * JSON

* Smart debounced search

* Advanced filters

* Department management

* Live department statistics

---

# 📝 Audit Logging

Every action is logged using **Winston Logger** including:

* Login attempts
* Employee updates
* Department updates
* Password changes
* Admin actions

---

# 🎨 Modern UI

* Framer Motion animations
* Particle animated background
* Floating orb effects
* Collapsible sidebar
* Dark / Light theme toggle
* Responsive UI for all devices

---

# 💻 Tech Stack

### Frontend

* React 18
* Framer Motion
* Chart.js
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JWT
* bcrypt

### Other Tools

* Winston (logging)
* ExcelJS
* CSV parser

---

# 📂 Project Structure

```
empaxis
│
├── frontend
│   ├── components
│   ├── pages
│   ├── layouts
│   ├── hooks
│   └── utils
│
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── services
│   └── config
```

---

# ⚙️ Installation

cd backend
---
npm install
---
npm run dev
---
cd frontend
---
npm install react-scripts@5.0.1 --save --legacy-peer-deps
---
npm install react@18.2.0 react-dom@18.2.0 react-router-dom@6.20.0 axios@1.6.2 framer-motion@10.16.5 chart.js@4.4.0 react-chartjs-2@5.2.0 react-hot-toast@2.4.1 date-fns@2.30.0 lucide-react@0.294.0 --save --legacy-peer-deps
---
npm install ajv@^8.0.0 --save --legacy-peer-deps
---
npm start
---

# 📈 Future Improvements

* Payroll management
* Attendance tracking
* Leave management
* Email notifications
* Role permission editor


# 🤝 Acknowledgement

Built as part of the **Full-Stack Development Internship at Prodigy InfoTech**.




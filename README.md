# TaskPulse AI - Automated Task Management Dashboard 🚀

TaskPulse AI is a modern, aesthetic, and automated task management dashboard designed to streamline team collaboration. It features a powerful task tracking system, role-based access control, and automated email notifications powered by **Boltic**.

## 🌟 Key Features

### 1. **Interactive Dashboard Views**
- **List View**: A detailed table view with sorting, filtering, and inline editing for quick updates.
- **Board (Kanban) View**: Drag-and-drop style columns for visual workflow management (Pending, In Progress, Completed, Overdue).
- **Calendar View**: A monthly calendar integration to visualize task distribution and deadlines.

### 2. **Authentication & User Management**
- Secure **Register & Login** system with JWT-based authentication.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Can create tasks, manage users, and delete tasks.
  - **Member**: Can view assigned tasks and update their status.
- **Workspace Isolation**: Tasks and users are scoped to their specific workspace.

### 3. **Smart Task Automation**
- **Create Tasks**: Admins can assign tasks with due dates, priorities, and descriptions.
- **Real-time Status Updates**: Team members can update task status (Pending → In Progress → Completed) with a single click.
- **Automated Notifications**: Integrated with **Boltic** to send email alerts whenever a task is created, updated, or deleted.

### 4. **Premium UI/UX**
- **Modern Design**: Clean, minimalist interface with glassmorphism effects and smooth animations.
- **Responsive**: Fully responsive layout for seamless use on all devices.
- **Custom Modals**: Aesthetic confirmation popups for critical actions like deleting tasks.

---

## 🛠️ Tech Stack

### **Frontend**
- **React.js (Vite)**: Fast and efficient frontend framework.
- **CSS3 (Custom Styling)**: Premium custom styles with animations and responsive design.
- **Lucide React**: Modern and clean icon library.
- **Axios**: Promised-based HTTP client for API requests.
- **React Hot Toast**: Beautiful and customizable toast notifications.

### **Backend**
- **Node.js & Express.js**: Robust backend server for handling API requests.
- **MongoDB & Mongoose**: rigorous NoSQL database for storing users and tasks.
- **JsonWebToken (JWT)**: Secure user authentication and session management.
- **Bcrypt.js**: Password hashing for enhanced security.
- **Dotenv**: Environment variable management.

### **DevOps & Tools**
- **Boltic**: Low-code platform for automated email workflows and data syncing.
- **Git & GitHub**: Version control and collaboration.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas URL)
- A Boltic account for email notifications (Optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rani-s123/HackathonFynd.git
   cd HackathonFynd
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file in the backend directory
   # Add your MONGO_URI, JWT_SECRET, and BOLTIC_WEBHOOK_URL
   npm run dev
   ```

4. **Access the App**
   Open your browser and navigate to `http://localhost:5173`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Rani-s123/HackathonFynd/issues).

## 📝 License

This project is licensed under the MIT License.

---

Built with ❤️ by [Rani-s123](https://github.com/Rani-s123) for the Fynd Hackathon.

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Workspace Schema (Optional for now, we'll use workspaceName in User)
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
    jobTitle: { type: String, default: 'Team Member' }, // New field: Frontend Developer, Designer, etc.
    workspaceName: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
    name: String,
    description: String,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assigneeName: String,
    assigneeEmail: String, // Added for notifications
    workspaceName: String,
    dueDate: Date,
    priority: String,
    status: { type: String, default: 'Pending' },
    avatar: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
const Task = mongoose.model('Task', taskSchema);

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email: rawEmail, password, name, workspaceName: rawWorkspace, jobTitle, role: requestedRole } = req.body;
        const email = rawEmail.toLowerCase().trim();
        const workspaceName = rawWorkspace.trim(); // Preserve casing

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Case-insensitive check to see if workspace exists
        const workspaceExists = await User.findOne({
            workspaceName: { $regex: new RegExp(`^${workspaceName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        });

        // Validation based on frontend selection
        if (requestedRole === 'Member' && !workspaceExists) {
            return res.status(404).json({ message: 'Workspace name not found. Please ask your Admin for the exact ID.' });
        }
        if (requestedRole === 'Admin' && workspaceExists) {
            return res.status(400).json({ message: 'This Workspace name is already taken. Please choose a unique name.' });
        }

        // Final role decision (fallback to Admin if not specified and doesn't exist)
        const role = requestedRole || (workspaceExists ? 'Member' : 'Admin');

        const newUser = await User.create({
            email,
            password: hashedPassword,
            name,
            workspaceName: workspaceExists ? workspaceExists.workspaceName : workspaceName,
            jobTitle: jobTitle || (role === 'Admin' ? 'Workspace Owner' : 'Team Member'),
            role
        });

        const token = jwt.sign({
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            workspaceName: newUser.workspaceName,
            jobTitle: newUser.jobTitle
        }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                workspaceName: newUser.workspaceName,
                jobTitle: newUser.jobTitle
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email: rawEmail, password } = req.body;
        const email = rawEmail.toLowerCase().trim();
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found");
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password match: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: user._id,
            email: user.email,
            role: user.role,
            workspaceName: user.workspaceName,
            jobTitle: user.jobTitle
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                workspaceName: user.workspaceName,
                jobTitle: user.jobTitle
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get workspace users
app.get('/api/users', auth, async (req, res) => {
    try {
        // Only get users belonging to the SAME workspace
        const users = await User.find({ workspaceName: req.user.workspaceName }, 'name email role jobTitle');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Update Profile
app.put('/api/users/profile', auth, async (req, res) => {
    try {
        const { name, jobTitle } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name, jobTitle },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Tasks filtered by Workspace
app.get('/api/tasks', auth, async (req, res) => {
    try {
        let query = { workspaceName: req.user.workspaceName };

        // Admin sees all tasks in workspace, Member sees only theirs
        if (req.user.role !== 'Admin') {
            query.assignee = req.user.id;
        }

        console.log(`Fetching tasks for user: ${req.user.email} (Role: ${req.user.role}, Workspace: ${req.user.workspaceName})`);
        const tasks = await Task.find(query).sort({ createdAt: -1 });
        console.log(`Found ${tasks.length} tasks`);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

app.post('/api/tasks', auth, async (req, res) => {
    try {
        const { assigneeId, ...taskData } = req.body;
        const targetUser = await User.findById(assigneeId || req.user.id);

        if (!targetUser) {
            return res.status(404).json({ message: 'Assignee not found' });
        }

        const newTask = await Task.create({
            ...taskData,
            assignee: targetUser._id,
            assigneeName: targetUser.name,
            assigneeEmail: targetUser.email, // Save email for Boltic
            workspaceName: req.user.workspaceName,
            createdBy: req.user.id,
            avatar: `https://i.pravatar.cc/150?u=${targetUser.email}`
        });

        triggerBoltic(newTask);
        res.status(201).json(newTask);
    } catch (err) {
        console.error('Task Creation Error:', err);
        res.status(500).json({ message: 'Error creating task' });
    }
});

// Manual Test Route for Boltic
app.get('/api/test-boltic', async (req, res) => {
    try {
        const dummyTask = {
            name: "Test Connection",
            assigneeName: "Test User",
            assigneeEmail: "test@example.com",
            workspaceName: "TestWorkspace",
            status: "Pending"
        };
        await triggerBoltic(dummyTask);
        res.json({ message: "Boltic notification sent! Check backend terminal for status." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/tasks/:id', auth, async (req, res) => {
    try {
        const updatedTask = await Task.findOneAndUpdate(
            { _id: req.params.id, workspaceName: req.user.workspaceName },
            req.body,
            { new: true }
        );
        if (updatedTask) triggerBoltic(updatedTask, 'Updated');
        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
    try {
        // Find task by ID and verify workspace ownership before deleting
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            workspaceName: req.user.workspaceName
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }

        if (task) triggerBoltic(task, 'Deleted');
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting task' });
    }
});

// Boltic
const triggerBoltic = async (task, eventType = 'Created') => {
    const url = process.env.BOLTIC_WEBHOOK_URL;
    if (!url) {
        console.log('Boltic Webhook URL not found in .env');
        return;
    }

    const payload = {
        task_id: task._id || task.id,
        taskName: task.name,
        description: task.description || 'Pulse Task',
        assignee: task.assigneeName,
        assigneeEmail: task.assigneeEmail,
        workspace: task.workspaceName,
        priority: task.priority || 'Medium',
        status: task.status,
        eventType, // e.g. Created, Updated, Deleted
        due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        timestamp: new Date().toISOString()
    };

    console.log('Pushing Task to Boltic Cloud Storage:', payload);

    try {
        const response = await axios.post(url, payload);
        console.log('Boltic Sync Status:', response.status);
    } catch (err) {
        console.error('Boltic Sync Error:', err.response?.data || err.message);
    }
};

app.listen(PORT, () => console.log(`TASKPULSE SERVER RUNNING ON PORT ${PORT}`));

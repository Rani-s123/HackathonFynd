import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  Search,
  Settings,
  Bell,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  Filter,
  Layers,
  MoreHorizontal,
  ChevronDown,
  Download,
  LogOut,
  Mail,
  Lock,
  User as UserIcon,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authMode, setAuthMode] = useState('login'); // login, register, forgot
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', workspaceName: '', jobTitle: '' });
  const [authError, setAuthError] = useState('');

  const [tasks, setTasks] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('list');

  const [newTaskName, setNewTaskName] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState(user?.id || '');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, taskId: null });

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchTeamUsers();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(resp.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      setLoading(false);
    }
  };

  const fetchTeamUsers = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamUsers(resp.data);
      if (!newAssigneeId && resp.data.length > 0) setNewAssigneeId(resp.data[0]._id);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
    try {
      const resp = await axios.post(`${API_BASE_URL}${endpoint}`, authForm);
      const { token, user } = resp.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);

      // Clear form which helps on logout
      setAuthForm({ email: '', password: '', name: '', workspaceName: '', jobTitle: '' });
      toast.success(`Welcome, ${user.name}! Login successful.`);

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Authentication failed';
      setAuthError(errorMsg);
      toast.error(errorMsg);
      console.error('Auth Error:', err);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTasks([]);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName) return;

    const payload = {
      name: newTaskName,
      description: 'Newly assigned task via pulse dashboard',
      assigneeId: newAssigneeId || user.id,
      dueDate: new Date(newDueDate || Date.now()).toISOString(),
      priority: newPriority,
      status: 'Pending'
    };

    try {
      await axios.post(`${API_BASE_URL}/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTaskName('');
      setNewDueDate('');
      fetchTasks();
    } catch (err) {
      console.error('Error adding task', err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      await axios.patch(`${API_BASE_URL}/tasks/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
      toast.success('Task updated successfully');
    } catch (err) {
      toast.error('Failed to update task');
      console.error('Error updating task', err);
    }
  };
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
      toast.success('Task deleted');
      setConfirmModal({ isOpen: false, taskId: null });
    } catch (err) {
      toast.error('Failed to delete task');
      console.error('Error deleting task', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const resp = await axios.put(`${API_BASE_URL}/users/profile`, {
        name: user.name,
        jobTitle: user.jobTitle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = { ...user, ...resp.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
      console.error('Error updating profile', err);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.assigneeName && task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!token) {
    return (
      <div className="auth-container" style={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e6e9ff 100%)',
        margin: 0,
        padding: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        <Toaster position="top-right" />
        <div className="auth-card" style={{
          background: 'white',
          padding: '2rem 2.5rem',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '450px',
          width: '90%'
        }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '12px', borderRadius: '12px', color: 'white', display: 'inline-flex', marginBottom: '1rem' }}>
              <AlertCircle size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b' }}>TaskPulse AI</h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
              {authMode === 'register' ? 'Join the future of automation' : authMode === 'forgot' ? 'Reset your password' : 'Welcome back!'}
            </p>
          </div>

          {authMode === 'register' && (
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setAuthForm({ ...authForm, role: 'Admin' })}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', backgroundColor: authForm.role === 'Admin' ? 'white' : 'transparent', color: authForm.role === 'Admin' ? '#2563eb' : '#64748b', boxShadow: authForm.role === 'Admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Create Company
              </button>
              <button
                onClick={() => setAuthForm({ ...authForm, role: 'Member' })}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', backgroundColor: authForm.role === 'Member' ? 'white' : 'transparent', color: authForm.role === 'Member' ? '#2563eb' : '#64748b', boxShadow: authForm.role === 'Member' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Join Team
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authMode === 'register' && (
              <>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                    <Layers size={16} /> {authForm.role === 'Admin' ? 'Company Name' : 'Existing Workspace Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={authForm.role === 'Admin' ? 'Acme Corp' : 'Workspace ID from Admin'}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    value={authForm.workspaceName}
                    onChange={(e) => setAuthForm({ ...authForm, workspaceName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                    <Users size={16} /> Job Title / Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Developer"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    value={authForm.jobTitle}
                    onChange={(e) => setAuthForm({ ...authForm, jobTitle: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                    <UserIcon size={16} /> Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                <Mail size={16} /> Work Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                <Lock size={16} /> Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
            </div>


            {authError && <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{authError}</p>}

            <button type="submit" className="btn-primary" style={{ padding: '0.85rem' }}>
              {authMode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
            {authMode === 'register' ? 'Already using TaskPulse?' : "New to TaskPulse?"} {' '}
            <button
              onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}
            >
              {authMode === 'register' ? 'Sign In' : 'Get Started'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div style={{ backgroundColor: '#2563eb', padding: '6px', borderRadius: '8px', color: 'white' }}>
            <AlertCircle size={20} />
          </div>
          TaskPulse AI
        </div>
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={14} /> {user?.workspaceName}
          </div>
        </div>

        <nav className="nav-links">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </div>
          {user?.role !== 'Admin' && (
            <div
              className={`nav-item ${activeTab === 'my-tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-tasks')}
            >
              <CheckCircle2 size={20} />
              My Tasks
            </div>
          )}
          <div
            className={`nav-item ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={20} />
            Team
          </div>
        </nav>

        <div className="sidebar-footer">
          <div
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Settings size={20} />
            Profile Settings
          </div>
          <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto', color: '#ef4444' }}>
            <LogOut size={20} />
            Logout
          </div>
          <div className="user-profile">
            <img src={`https://i.pravatar.cc/150?u=${user?.email}`} alt="User" className="user-avatar" />
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.jobTitle || user?.role || 'Member'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>TaskPulse Dashboard</h1>
            <p>Welcome back, {user?.name}! You are logged in as <strong>{user?.role}</strong>.</p>
          </div>
          <div className="header-right">
            {/* Unnecessary header elements removed for cleaner UI */}
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  Total Tasks
                  <Layers size={16} />
                </div>
                <div className="stat-value">{tasks.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  Pending
                  <Clock size={16} />
                </div>
                <div className="stat-value">{tasks.filter(t => t.status === 'Pending').length}</div>
                <div className="stat-subtext">Requires attention</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  Completed
                  <CheckCircle2 size={16} />
                </div>
                <div className="stat-value">{tasks.filter(t => t.status === 'Completed').length}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div className="stat-header">
                  Overdue
                  <AlertCircle size={16} color="#ef4444" />
                </div>
                <div className="stat-value" style={{ color: '#ef4444' }}>{tasks.filter(t => t.status === 'Overdue').length}</div>
              </div>
            </div>

            {/* View Controls */}
            <div className="view-controls">
              <div className="view-tabs">
                <button
                  className={`view-tab ${activeView === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveView('list')}
                >
                  <BarChart3 size={16} />
                  List view
                </button>
                <button
                  className={`view-tab ${activeView === 'board' ? 'active' : ''}`}
                  onClick={() => setActiveView('board')}
                >
                  <Layers size={16} />
                  Board
                </button>
                <button
                  className={`view-tab ${activeView === 'calendar' ? 'active' : ''}`}
                  onClick={() => setActiveView('calendar')}
                >
                  <Calendar size={16} />
                  Calendar
                </button>
              </div>
            </div>

            {/* Create Task Form - ONLY FOR ADMIN */}
            {user?.role === 'Admin' ? (
              <div className="task-form-card">
                <h2>Create New Pulse Task</h2>
                <form className="form-row" onSubmit={handleAddTask}>
                  <div className="form-group">
                    <label>Task Name</label>
                    <input
                      type="text"
                      placeholder="Follow up on invoice #2034"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Assignee</label>
                    <select value={newAssigneeId} onChange={(e) => setNewAssigneeId(e.target.value)}>
                      {teamUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Pulse Task</button>
                </form>
              </div>
            ) : (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AlertCircle color="#2563eb" size={24} />
                <div>
                  <h3 style={{ color: '#1e3a8a', fontSize: '1rem', fontWeight: '600' }}>Your Focused View</h3>
                  <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>You are viewing tasks specifically assigned to you by your Admin. Stay focused and complete your pulses on time!</p>
                </div>
              </div>
            )}

            {/* Conditional Rendering based on activeView */}
            {activeView === 'list' ? (
              <div className="data-table-container">
                <div className="table-header">
                  <h3>Recent Tasks</h3>
                  <button className="btn-icon">
                    <Plus size={16} />
                    Export
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading tasks...</td></tr>
                    ) : filteredTasks.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center' }}>No tasks found matching your search.</td></tr>
                    ) : (
                      filteredTasks.map(task => (
                        <tr key={task._id} className="fade-in">
                          <td>
                            <div className="task-cell">
                              <span className="task-name">{task.name}</span>
                              <span className="task-desc">{task.description}</span>
                            </div>
                          </td>
                          <td>
                            <div className="assignee-cell">
                              <img src={task.avatar || `https://i.pravatar.cc/150?u=${task.assigneeName}`} alt={task.assigneeName} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                              {task.assigneeName}
                            </div>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="date-input"
                              value={new Date(task.dueDate).toISOString().split('T')[0]}
                              onChange={(e) => updateTask(task._id, { dueDate: e.target.value })}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: task.priority === 'High' || task.priority === 'Critical' ? '#ef4444' : task.priority === 'Medium' ? '#f97316' : '#22c55e'
                              }}></span>
                              {task.priority}
                            </div>
                          </td>
                          <td>
                            <select
                              className={`status-select ${task.status.toLowerCase().replace(' ', '')}`}
                              value={task.status}
                              onChange={(e) => updateTask(task._id, { status: e.target.value })}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button
                                className="btn-secondary"
                                onClick={() => updateTask(task._id, { status: task.status === 'Completed' ? 'Pending' : 'Completed' })}
                              >
                                {task.status === 'Completed' ? 'Undo Done' : 'Mark as Done'}
                              </button>
                              {user?.role === 'Admin' && (
                                <button
                                  className="btn-icon"
                                  style={{ border: 'none', color: '#ef4444' }}
                                  onClick={() => setConfirmModal({ isOpen: true, taskId: task._id })}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <button className="btn-icon" style={{ border: 'none' }}>
                                <MoreHorizontal size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeView === 'board' ? (
              <div className="board-container">
                {['Pending', 'In Progress', 'Completed', 'Overdue'].map(status => (
                  <div key={status} className="board-column">
                    <div className="column-header">
                      <h3>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: status === 'Completed' ? '#22c55e' : status === 'Pending' ? '#f97316' : status === 'In Progress' ? '#3b82f6' : '#ef4444'
                        }}></span>
                        {status}
                      </h3>
                      <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>
                        {filteredTasks.filter(t => t.status === status).length}
                      </span>
                    </div>
                    <div className="task-stack">
                      {filteredTasks.filter(t => t.status === status).map(task => (
                        <div key={task._id} className="task-card">
                          <div className="task-card-header">
                            <span className="task-card-title">{task.name}</span>
                            <button className="btn-icon" style={{ border: 'none', padding: 0 }} onClick={() => updateTask(task._id, { status: task.status === 'Completed' ? 'Pending' : 'Completed' })}>
                              <CheckCircle2 size={14} color={task.status === 'Completed' ? '#22c55e' : '#94a3b8'} />
                            </button>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{task.description}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <img src={task.avatar || `https://i.pravatar.cc/150?u=${task.assigneeName}`} style={{ width: 18, height: 18, borderRadius: '50%' }} alt="" />
                            <span style={{ fontSize: '11px', fontWeight: '500' }}>{task.assigneeName}</span>
                          </div>
                          <div className="task-card-footer">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className="due-tag">
                                <Calendar size={12} />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              {user?.role === 'Admin' && (
                                <button
                                  className="btn-icon"
                                  style={{ border: 'none', color: '#ef4444', padding: 0 }}
                                  onClick={() => setConfirmModal({ isOpen: true, taskId: task._id })}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: task.priority === 'High' || task.priority === 'Critical' ? '#ef4444' : '#64748b'
                            }}>{task.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="calendar-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="calendar-day-header">{day}</div>
                ))}
                {Array.from({ length: 28 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (date.getDay() - 1) + i); // Corrected to start from current week Monday
                  const dateStr = date.toDateString();
                  const tasksForDay = filteredTasks.filter(t => new Date(t.dueDate).toDateString() === dateStr);

                  return (
                    <div key={i} className="calendar-day" style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                      <div className="day-number">{date.getDate()}</div>
                      {tasksForDay.map(t => (
                        <div key={t._id} className={`calendar-task-item cal-task-priority-${t.priority.toLowerCase()}`}>
                          {t.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === 'team' ? (
          <div className="team-container" style={{ padding: '0.5rem' }}>
            <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 15px -10px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Team Workspace</h2>
                  <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                    Managing organization: <span style={{ color: '#2563eb', fontWeight: '700' }}>{user?.workspaceName}</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '8px' }}>Workspace ID for Invite</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <code style={{ fontSize: '1.25rem', color: '#1e293b', fontWeight: '800', fontFamily: 'monospace' }}>{user?.workspaceName}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(user?.workspaceName)}
                        style={{ background: '#2563eb', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="member-list-section">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={24} color="#2563eb" /> Active pulse members ({teamUsers.length})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                  {teamUsers.map((member) => (
                    <div key={member.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.25rem',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: member.email === user?.email ? '#f0f9ff' : 'white',
                      borderColor: member.email === user?.email ? '#bae6fd' : '#e2e8f0',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={`https://i.pravatar.cc/150?u=${member.email}`}
                            alt={member.name}
                            style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }}
                          />
                          {member.email === user?.email && (
                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid white' }}></div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>
                            {member.name} {member.email === user?.email && <span style={{ fontSize: '0.65rem', backgroundColor: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '6px', verticalAlign: 'middle', marginLeft: '6px' }}>YOU</span>}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>{member.jobTitle || member.role}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{member.email}</div>
                        </div>
                      </div>
                      <div>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          letterSpacing: '0.025em',
                          backgroundColor: member.role === 'Admin' ? '#fef3c7' : '#f1f5f9',
                          color: member.role === 'Admin' ? '#92400e' : '#475569',
                          border: member.role === 'Admin' ? '1px solid #fde68a' : '1px solid #e2e8f0'
                        }}>
                          {member.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {user?.role === 'Admin' && (
                <div style={{
                  marginTop: '3rem',
                  padding: '1.5rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(to right, #2563eb, #3b82f6)',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.25rem' }}>Invite your teammate!</h4>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Just share your Workspace ID to bring them onboard this pulse dashboard.</p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '12px', backdropFilter: 'blur(4px)', fontWeight: '700', letterSpacing: '1px' }}>
                    {user?.workspaceName}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="profile-container" style={{ padding: '0.5rem' }}>
            <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 15px -10px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem' }}>Profile Settings</h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '20px' }}>
                <img src={`https://i.pravatar.cc/150?u=${user?.email}`} style={{ width: '80px', height: '80px', borderRadius: '20px' }} alt="Profile" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{user?.name}</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Full Name</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    value={user?.name || ''}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Job Title</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    value={user?.jobTitle || ''}
                    onChange={(e) => setUser({ ...user, jobTitle: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Workspace (Permanent)</label>
                  <input
                    type="text"
                    disabled
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                    value={user?.workspaceName || ''}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '0.85rem', marginTop: '1rem' }}>Save Changes</button>
              </form>
            </div>
          </div>
        ) : activeTab === 'my-tasks' ? (
          <div className="my-tasks-container">
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CheckCircle2 color="#2563eb" size={24} />
              <div>
                <h3 style={{ color: '#1e3a8a', fontSize: '1rem', fontWeight: '600' }}>My Assigned Pulses</h3>
                <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>These are tasks assigned directly to you. Complete them to keep the workspace pulse active!</p>
              </div>
            </div>

            <div className="data-table-container">
              <div className="table-header">
                <h3>My Tasks</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading...</td></tr>
                  ) : tasks.filter(t => t.assignee === user?.id || t.assigneeName === user?.name).length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>No tasks assigned to you yet.</td></tr>
                  ) : (
                    tasks.filter(t => t.assignee === user?.id || t.assigneeName === user?.name).map(task => (
                      <tr key={task._id} className="fade-in">
                        <td>
                          <div className="task-cell">
                            <span className="task-name">{task.name}</span>
                            <span className="task-desc">{task.description}</span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="date"
                            className="date-input"
                            value={new Date(task.dueDate).toISOString().split('T')[0]}
                            onChange={(e) => updateTask(task._id, { dueDate: e.target.value })}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: task.priority === 'High' || task.priority === 'Critical' ? '#ef4444' : task.priority === 'Medium' ? '#f97316' : '#22c55e'
                            }}></span>
                            {task.priority}
                          </div>
                        </td>
                        <td>
                          <select
                            className={`status-select ${task.status.toLowerCase().replace(' ', '')}`}
                            value={task.status}
                            onChange={(e) => updateTask(task._id, { status: e.target.value })}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="btn-secondary"
                              onClick={() => updateTask(task._id, { status: task.status === 'Completed' ? 'Pending' : 'Completed' })}
                            >
                              {task.status === 'Completed' ? 'Undo Done' : 'Mark as Done'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
            <h2 style={{ marginBottom: '10px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')} Section</h2>
            <p style={{ color: '#64748b' }}>This section is currently under development. Please check back later.</p>
          </div>
        )}
      </main>
      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">
              <Trash2 size={32} />
            </div>
            <h3 className="modal-title">Delete Task?</h3>
            <p className="modal-text">
              Are you sure you want to remove this task? This action cannot be undone and will affect workspace pulse stats.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setConfirmModal({ isOpen: false, taskId: null })}
              >
                Keep Task
              </button>
              <button
                className="modal-btn modal-btn-delete"
                onClick={() => handleDeleteTask(confirmModal.taskId)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

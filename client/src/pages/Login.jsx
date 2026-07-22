import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@edu.com', password: 'admin123', color: 'admin' },
  { role: 'Teacher', email: 'sarah@edu.com', password: 'teacher123', color: 'teacher' },
  { role: 'Student', email: 'alice@university.edu', password: 'student123', color: 'student' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">CM</div>
          <h1>
            Course<span>Manager</span>
          </h1>
          <p>Sign in to manage courses, students, and enrollments</p>
        </div>

        <div className="login-card glass">
          <h2>Welcome back</h2>
          <p className="login-subtitle">Choose your role or enter credentials</p>

          <div className="role-cards">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className={`role-card role-${acc.color}`}
                onClick={() => quickLogin(acc)}
              >
                <span className="role-icon">
                  {acc.role === 'Admin' ? '🛡️' : acc.role === 'Teacher' ? '👨‍🏫' : '🎓'}
                </span>
                <span className="role-name">{acc.role}</span>
                <span className="role-email">{acc.email}</span>
              </button>
            ))}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

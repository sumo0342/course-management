import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- API client (merged in from the former api.js file) ---
const BASE = '/api';
const TOKEN_KEY = 'cms_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  changePassword: (body) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
  getStats: () => request('/stats'),
  getCourses: () => request('/courses'),
  getCourse: (id) => request(`/courses/${id}`),
  createCourse: (body) => request('/courses', { method: 'POST', body: JSON.stringify(body) }),
  updateCourse: (id, body) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  getStudents: () => request('/students'),
  createStudent: (body) => request('/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id, body) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  getTeachers: () => request('/teachers'),
  createTeacher: (body) => request('/teachers', { method: 'POST', body: JSON.stringify(body) }),
  updateTeacher: (id, body) => request(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTeacher: (id) => request(`/teachers/${id}`, { method: 'DELETE' }),
  getMyEnrollments: () => request('/my-enrollments'),
  enroll: (body) => request('/enrollments', { method: 'POST', body: JSON.stringify(body) }),
  unenroll: (body) => request('/enrollments', { method: 'DELETE', body: JSON.stringify(body) }),
  getAssignments: (courseId) => request(`/courses/${courseId}/assignments`),
  createAssignment: (body) => request('/assignments', { method: 'POST', body: JSON.stringify(body) }),
  updateAssignment: (id, body) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),
  getAssignmentGrades: (assignmentId) => request(`/assignments/${assignmentId}/grades`),
  setGrade: (assignmentId, body) => request(`/assignments/${assignmentId}/grades`, { method: 'POST', body: JSON.stringify(body) }),
  getMyResults: () => request('/my-results'),
};
// --- end merged API client ---

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { token, user: loggedIn } = await api.login({ email, password });
    setToken(token);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

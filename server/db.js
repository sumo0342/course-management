const fs = require('fs');
const path = require('path');
const { hashPassword, verifyPassword, generateToken, sanitizeUser } = require('./auth');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const DB_PATH = path.join(__dirname, 'data.json');

const defaultData = {
  users: [],
  teachers: [],
  students: [],
  courses: [],
  enrollments: [],
  assignments: [],
  grades: [],
  sessions: [],
  nextIds: { users: 1, teachers: 1, students: 1, courses: 1, enrollments: 1, assignments: 1, grades: 1 },
};

function read() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch {
    /* fall through */
  }
  return structuredClone(defaultData);
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function seed(data) {
  if (data.users?.length > 0) return data;

  const now = new Date().toISOString();

  data.teachers = [
    { id: 1, name: 'Dr. Sarah Chen', email: 'sarah@edu.com', department: 'Computer Science', created_at: now },
    { id: 2, name: 'Prof. Michael Torres', email: 'michael@edu.com', department: 'Computer Science', created_at: now },
    { id: 3, name: 'Dr. Emily Watson', email: 'emily@edu.com', department: 'Information Systems', created_at: now },
    { id: 4, name: 'Dr. James Park', email: 'james@edu.com', department: 'Data Science', created_at: now },
  ];

  data.students = [
    { id: 1, name: 'Alice Johnson', email: 'alice@university.edu', created_at: now },
    { id: 2, name: 'Bob Smith', email: 'bob@university.edu', created_at: now },
    { id: 3, name: 'Carol Williams', email: 'carol@university.edu', created_at: now },
    { id: 4, name: 'David Brown', email: 'david@university.edu', created_at: now },
    { id: 5, name: 'Eva Martinez', email: 'eva@university.edu', created_at: now },
  ];

  data.users = [
    { id: 1, name: 'System Admin', email: 'admin@edu.com', password: hashPassword('admin123'), role: 'admin', profile_id: null, created_at: now },
    { id: 2, name: 'Dr. Sarah Chen', email: 'sarah@edu.com', password: hashPassword('teacher123'), role: 'teacher', profile_id: 1, created_at: now },
    { id: 3, name: 'Prof. Michael Torres', email: 'michael@edu.com', password: hashPassword('teacher123'), role: 'teacher', profile_id: 2, created_at: now },
    { id: 4, name: 'Alice Johnson', email: 'alice@university.edu', password: hashPassword('student123'), role: 'student', profile_id: 1, created_at: now },
    { id: 5, name: 'Bob Smith', email: 'bob@university.edu', password: hashPassword('student123'), role: 'student', profile_id: 2, created_at: now },
    { id: 6, name: 'Carol Williams', email: 'carol@university.edu', password: hashPassword('student123'), role: 'student', profile_id: 3, created_at: now },
  ];

  data.courses = [
    { id: 1, title: 'Introduction to Web Development', description: 'Learn HTML, CSS, and JavaScript fundamentals to build modern websites.', teacher_id: 1, capacity: 30, schedule: 'Mon/Wed 10:00 AM - 11:30 AM', created_at: now },
    { id: 2, title: 'Data Structures & Algorithms', description: 'Master essential data structures and algorithmic problem-solving techniques.', teacher_id: 2, capacity: 25, schedule: 'Tue/Thu 2:00 PM - 3:30 PM', created_at: now },
    { id: 3, title: 'Database Systems', description: 'Design and implement relational databases with SQL and optimization strategies.', teacher_id: 3, capacity: 20, schedule: 'Mon/Fri 1:00 PM - 2:30 PM', created_at: now },
    { id: 4, title: 'Machine Learning Fundamentals', description: 'Explore supervised and unsupervised learning with hands-on Python projects.', teacher_id: 4, capacity: 35, schedule: 'Wed/Fri 9:00 AM - 10:30 AM', created_at: now },
  ];

  data.enrollments = [
    { id: 1, course_id: 1, student_id: 1, enrolled_at: now },
    { id: 2, course_id: 1, student_id: 2, enrolled_at: now },
    { id: 3, course_id: 1, student_id: 3, enrolled_at: now },
    { id: 4, course_id: 2, student_id: 2, enrolled_at: now },
    { id: 5, course_id: 2, student_id: 4, enrolled_at: now },
    { id: 6, course_id: 3, student_id: 1, enrolled_at: now },
    { id: 7, course_id: 3, student_id: 5, enrolled_at: now },
    { id: 8, course_id: 4, student_id: 3, enrolled_at: now },
    { id: 9, course_id: 4, student_id: 4, enrolled_at: now },
    { id: 10, course_id: 4, student_id: 5, enrolled_at: now },
  ];

  data.assignments = [
    { id: 1, course_id: 1, title: 'HTML/CSS Portfolio Page', description: 'Build a personal portfolio page using semantic HTML and CSS.', due_date: '2026-08-15', max_score: 100, created_at: now },
    { id: 2, course_id: 1, title: 'JavaScript Basics Quiz', description: 'Short quiz covering variables, functions, and loops.', due_date: '2026-08-01', max_score: 50, created_at: now },
    { id: 3, course_id: 2, title: 'Binary Search Tree Implementation', description: 'Implement insert, delete, and traversal for a BST.', due_date: '2026-08-20', max_score: 100, created_at: now },
    { id: 4, course_id: 3, title: 'ER Diagram Design', description: 'Design an ER diagram for a library management system.', due_date: '2026-08-10', max_score: 75, created_at: now },
  ];

  data.grades = [
    { id: 1, assignment_id: 1, student_id: 1, score: 92, feedback: 'Great use of semantic tags.', graded_at: now },
    { id: 2, assignment_id: 1, student_id: 2, score: 78, feedback: 'Good, but check responsive layout.', graded_at: now },
    { id: 3, assignment_id: 2, student_id: 1, score: 45, feedback: '', graded_at: now },
    { id: 4, assignment_id: 3, student_id: 2, score: 88, feedback: 'Solid implementation.', graded_at: now },
  ];

  data.sessions = [];
  data.nextIds = { users: 7, teachers: 5, students: 6, courses: 5, enrollments: 11, assignments: 5, grades: 5 };
  return data;
}

let data = seed(read());
// Migration guard: older data.json files (saved before assignments/grades existed)
// won't have these keys — backfill them so the app doesn't crash on upgrade.
if (!data.assignments) data.assignments = [];
if (!data.grades) data.grades = [];
if (!data.nextIds.assignments) data.nextIds.assignments = 1;
if (!data.nextIds.grades) data.nextIds.grades = 1;
write(data);

function nextId(type) {
  const id = data.nextIds[type];
  data.nextIds[type]++;
  return id;
}

function save() {
  write(data);
}

function getTeacher(id) {
  return data.teachers.find((t) => t.id === id) || null;
}

function enrolledCount(courseId) {
  return data.enrollments.filter((e) => e.course_id === courseId).length;
}

function studentEnrolledCount(studentId) {
  return data.enrollments.filter((e) => e.student_id === studentId).length;
}

function teacherCourseCount(teacherId) {
  return data.courses.filter((c) => c.teacher_id === teacherId).length;
}

function enrichCourse(course) {
  const teacher = getTeacher(course.teacher_id);
  return {
    ...course,
    instructor: teacher?.name || 'Unknown',
    teacher_name: teacher?.name || 'Unknown',
    teacher_email: teacher?.email || '',
    enrolled_count: enrolledCount(course.id),
  };
}

function withCourseCounts(courses) {
  return courses
    .map(enrichCourse)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function withStudentCounts(students) {
  return students
    .map((s) => ({ ...s, enrolled_count: studentEnrolledCount(s.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function withTeacherCounts(teachers) {
  return teachers
    .map((t) => ({ ...t, course_count: teacherCourseCount(t.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function isEnrolled(courseId, studentId) {
  return data.enrollments.some((e) => e.course_id === courseId && e.student_id === studentId);
}

function canManageCourse(course, user) {
  if (!course || !user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'teacher' && course.teacher_id === user.profile_id;
}

module.exports = {
  login(email, password) {
    const user = data.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.password)) {
      throw new Error('Invalid email or password');
    }
    const token = generateToken();
    const now = Date.now();
    data.sessions.push({
      token,
      user_id: user.id,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + SESSION_TTL_MS).toISOString(),
    });
    save();
    return { token, user: sanitizeUser(user) };
  },

  logout(token) {
    data.sessions = data.sessions.filter((s) => s.token !== token);
    save();
  },

  getSession(token) {
    const session = data.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      // Session expired — clean it up and reject.
      data.sessions = data.sessions.filter((s) => s.token !== token);
      save();
      return null;
    }
    const user = data.users.find((u) => u.id === session.user_id);
    if (!user) return null;
    return { user };
  },

  getStats(user) {
    if (user.role === 'teacher') {
      const myCourses = data.courses.filter((c) => c.teacher_id === user.profile_id);
      const enrollments = data.enrollments.filter((e) => myCourses.some((c) => c.id === e.course_id));
      return { courses: myCourses.length, students: new Set(enrollments.map((e) => e.student_id)).size, enrollments: enrollments.length, teachers: 0 };
    }
    if (user.role === 'student') {
      const myEnrollments = data.enrollments.filter((e) => e.student_id === user.profile_id);
      return { courses: data.courses.length, students: 1, enrollments: myEnrollments.length, teachers: data.teachers.length };
    }
    return {
      courses: data.courses.length,
      students: data.students.length,
      enrollments: data.enrollments.length,
      teachers: data.teachers.length,
    };
  },

  getUsers() {
    return data.users.map(sanitizeUser);
  },

  createUser({ name, email, password, role, profile_id }) {
    if (data.users.some((u) => u.email === email)) throw new Error('Email already exists');
    const user = {
      id: nextId('users'),
      name,
      email,
      password: hashPassword(password),
      role,
      profile_id: profile_id || null,
      created_at: new Date().toISOString(),
    };
    data.users.push(user);
    save();
    return sanitizeUser(user);
  },

  deleteUser(id) {
    const before = data.users.length;
    data.users = data.users.filter((u) => u.id !== id);
    save();
    return data.users.length < before;
  },

  getTeachers() {
    return withTeacherCounts(data.teachers);
  },

  createTeacher({ name, email, department, password }) {
    if (data.teachers.some((t) => t.email === email)) throw new Error('Email already exists');
    if (data.users.some((u) => u.email === email)) throw new Error('Email already exists');
    const teacher = {
      id: nextId('teachers'),
      name,
      email,
      department: department || '',
      created_at: new Date().toISOString(),
    };
    data.teachers.push(teacher);
    const user = {
      id: nextId('users'),
      name,
      email,
      password: hashPassword(password || 'teacher123'),
      role: 'teacher',
      profile_id: teacher.id,
      created_at: new Date().toISOString(),
    };
    data.users.push(user);
    save();
    return { ...teacher, course_count: 0 };
  },

  updateTeacher(id, updates) {
    const idx = data.teachers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    if (updates.email && data.teachers.some((t) => t.email === updates.email && t.id !== id)) {
      throw new Error('Email already exists');
    }
    data.teachers[idx] = { ...data.teachers[idx], ...updates };
    const userIdx = data.users.findIndex((u) => u.role === 'teacher' && u.profile_id === id);
    if (userIdx !== -1) {
      data.users[userIdx].name = updates.name ?? data.users[userIdx].name;
      data.users[userIdx].email = updates.email ?? data.users[userIdx].email;
    }
    save();
    return { ...data.teachers[idx], course_count: teacherCourseCount(id) };
  },

  deleteTeacher(id) {
    const before = data.teachers.length;
    const removedCourseIds = data.courses.filter((c) => c.teacher_id === id).map((c) => c.id);
    data.teachers = data.teachers.filter((t) => t.id !== id);
    data.courses = data.courses.filter((c) => c.teacher_id !== id);
    data.users = data.users.filter((u) => !(u.role === 'teacher' && u.profile_id === id));
    const removedAssignmentIds = data.assignments.filter((a) => removedCourseIds.includes(a.course_id)).map((a) => a.id);
    data.assignments = data.assignments.filter((a) => !removedCourseIds.includes(a.course_id));
    data.grades = data.grades.filter((g) => !removedAssignmentIds.includes(g.assignment_id));
    save();
    return data.teachers.length < before;
  },

  getCourses(user) {
    let courses = data.courses;
    if (user?.role === 'teacher') {
      courses = courses.filter((c) => c.teacher_id === user.profile_id);
    }
    return withCourseCounts(courses).map((c) => ({
      ...c,
      is_enrolled: user?.role === 'student' ? isEnrolled(c.id, user.profile_id) : undefined,
    }));
  },

  getCourse(id, user) {
    const course = data.courses.find((c) => c.id === id);
    if (!course) return null;
    if (user?.role === 'teacher' && course.teacher_id !== user.profile_id) return null;

    const students = data.enrollments
      .filter((e) => e.course_id === id)
      .map((e) => {
        const student = data.students.find((s) => s.id === e.student_id);
        return { ...student, enrolled_at: e.enrolled_at };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      ...enrichCourse(course),
      students,
      is_enrolled: user?.role === 'student' ? isEnrolled(id, user.profile_id) : undefined,
    };
  },

  createCourse({ title, description, teacher_id, capacity, schedule }, user) {
    const tid = user.role === 'teacher' ? user.profile_id : teacher_id;
    if (!tid) throw new Error('Teacher is required');
    const course = {
      id: nextId('courses'),
      title,
      description: description || '',
      teacher_id: tid,
      capacity: capacity || 30,
      schedule: schedule || '',
      created_at: new Date().toISOString(),
    };
    data.courses.push(course);
    save();
    return enrichCourse(course);
  },

  updateCourse(id, updates, user) {
    const idx = data.courses.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    if (user.role === 'teacher' && data.courses[idx].teacher_id !== user.profile_id) return null;
    if (user.role === 'teacher') delete updates.teacher_id;
    data.courses[idx] = { ...data.courses[idx], ...updates };
    save();
    return enrichCourse(data.courses[idx]);
  },

  deleteCourse(id, user) {
    const course = data.courses.find((c) => c.id === id);
    if (!course) return false;
    if (user.role === 'teacher' && course.teacher_id !== user.profile_id) return false;
    data.courses = data.courses.filter((c) => c.id !== id);
    data.enrollments = data.enrollments.filter((e) => e.course_id !== id);
    const removedAssignmentIds = data.assignments.filter((a) => a.course_id === id).map((a) => a.id);
    data.assignments = data.assignments.filter((a) => a.course_id !== id);
    data.grades = data.grades.filter((g) => !removedAssignmentIds.includes(g.assignment_id));
    save();
    return true;
  },

  getStudents(user) {
    if (user.role === 'teacher') {
      const myCourseIds = data.courses.filter((c) => c.teacher_id === user.profile_id).map((c) => c.id);
      const studentIds = new Set(
        data.enrollments.filter((e) => myCourseIds.includes(e.course_id)).map((e) => e.student_id)
      );
      return withStudentCounts(data.students.filter((s) => studentIds.has(s.id)));
    }
    return withStudentCounts(data.students);
  },

  createStudent({ name, email, password }) {
    if (data.students.some((s) => s.email === email)) throw new Error('Email already exists');
    if (data.users.some((u) => u.email === email)) throw new Error('Email already exists');
    const student = {
      id: nextId('students'),
      name,
      email,
      created_at: new Date().toISOString(),
    };
    data.students.push(student);
    data.users.push({
      id: nextId('users'),
      name,
      email,
      password: hashPassword(password || 'student123'),
      role: 'student',
      profile_id: student.id,
      created_at: new Date().toISOString(),
    });
    save();
    return { ...student, enrolled_count: 0 };
  },

  updateStudent(id, updates) {
    const idx = data.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    if (updates.email && data.students.some((s) => s.email === updates.email && s.id !== id)) {
      throw new Error('Email already exists');
    }
    data.students[idx] = { ...data.students[idx], ...updates };
    const userIdx = data.users.findIndex((u) => u.role === 'student' && u.profile_id === id);
    if (userIdx !== -1) {
      data.users[userIdx].name = updates.name ?? data.users[userIdx].name;
      data.users[userIdx].email = updates.email ?? data.users[userIdx].email;
    }
    save();
    return { ...data.students[idx], enrolled_count: studentEnrolledCount(id) };
  },

  deleteStudent(id) {
    const before = data.students.length;
    data.students = data.students.filter((s) => s.id !== id);
    data.enrollments = data.enrollments.filter((e) => e.student_id !== id);
    data.users = data.users.filter((u) => !(u.role === 'student' && u.profile_id === id));
    data.grades = data.grades.filter((g) => g.student_id !== id);
    save();
    return data.students.length < before;
  },

  getMyEnrollments(studentId) {
    return data.enrollments
      .filter((e) => e.student_id === studentId)
      .map((e) => {
        const course = data.courses.find((c) => c.id === e.course_id);
        return { ...enrichCourse(course), enrolled_at: e.enrolled_at };
      })
      .sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at));
  },

  enroll(courseId, studentId) {
    const course = data.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course not found');
    const student = data.students.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found');
    if (enrolledCount(courseId) >= course.capacity) throw new Error('Course is at full capacity');
    if (isEnrolled(courseId, studentId)) throw new Error('Already enrolled in this course');
    data.enrollments.push({
      id: nextId('enrollments'),
      course_id: courseId,
      student_id: studentId,
      enrolled_at: new Date().toISOString(),
    });
    save();
    return { success: true, course_id: courseId, student_id: studentId };
  },

  unenroll(courseId, studentId) {
    const before = data.enrollments.length;
    data.enrollments = data.enrollments.filter(
      (e) => !(e.course_id === courseId && e.student_id === studentId)
    );
    save();
    return data.enrollments.length < before;
  },

  changePassword(userId, currentPassword, newPassword) {
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    if (!verifyPassword(currentPassword, data.users[idx].password)) {
      throw new Error('Current password is incorrect');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }
    data.users[idx].password = hashPassword(newPassword);
    // Changing the password invalidates all existing sessions for this user
    // (except the one making this request gets a fresh token below).
    data.sessions = data.sessions.filter((s) => s.user_id !== userId);
    const token = generateToken();
    const now = Date.now();
    data.sessions.push({
      token,
      user_id: userId,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + SESSION_TTL_MS).toISOString(),
    });
    save();
    return { token };
  },

  // --- Assignments ---

  getAssignments(courseId, user) {
    const course = data.courses.find((c) => c.id === courseId);
    if (!course) return null;
    if (user.role === 'teacher' && course.teacher_id !== user.profile_id) return null;
    if (user.role === 'student' && !isEnrolled(courseId, user.profile_id)) return null;

    const assignments = data.assignments.filter((a) => a.course_id === courseId);
    return assignments
      .map((a) => {
        if (user.role === 'student') {
          const grade = data.grades.find((g) => g.assignment_id === a.id && g.student_id === user.profile_id);
          return {
            ...a,
            my_score: grade ? grade.score : null,
            my_feedback: grade ? grade.feedback : '',
            graded: !!grade,
          };
        }
        const enrolledCountForCourse = enrolledCount(a.course_id);
        const gradedCount = data.grades.filter((g) => g.assignment_id === a.id && g.score != null).length;
        return { ...a, enrolled_count: enrolledCountForCourse, graded_count: gradedCount };
      })
      .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
  },

  createAssignment({ course_id, title, description, due_date, max_score }, user) {
    const course = data.courses.find((c) => c.id === course_id);
    if (!course) throw new Error('Course not found');
    if (!canManageCourse(course, user)) throw new Error('Access denied');
    if (!title) throw new Error('Title is required');
    const assignment = {
      id: nextId('assignments'),
      course_id,
      title,
      description: description || '',
      due_date: due_date || null,
      max_score: max_score && max_score > 0 ? max_score : 100,
      created_at: new Date().toISOString(),
    };
    data.assignments.push(assignment);
    save();
    return assignment;
  },

  updateAssignment(id, updates, user) {
    const idx = data.assignments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const course = data.courses.find((c) => c.id === data.assignments[idx].course_id);
    if (!canManageCourse(course, user)) return null;
    const { course_id, ...safeUpdates } = updates; // course_id is immutable once created
    data.assignments[idx] = { ...data.assignments[idx], ...safeUpdates };
    save();
    return data.assignments[idx];
  },

  deleteAssignment(id, user) {
    const assignment = data.assignments.find((a) => a.id === id);
    if (!assignment) return false;
    const course = data.courses.find((c) => c.id === assignment.course_id);
    if (!canManageCourse(course, user)) return false;
    data.assignments = data.assignments.filter((a) => a.id !== id);
    data.grades = data.grades.filter((g) => g.assignment_id !== id);
    save();
    return true;
  },

  // --- Grades / Results ---

  getAssignmentGrades(assignmentId, user) {
    const assignment = data.assignments.find((a) => a.id === assignmentId);
    if (!assignment) return null;
    const course = data.courses.find((c) => c.id === assignment.course_id);
    if (!canManageCourse(course, user)) return null;

    return data.enrollments
      .filter((e) => e.course_id === assignment.course_id)
      .map((e) => {
        const student = data.students.find((s) => s.id === e.student_id);
        const grade = data.grades.find((g) => g.assignment_id === assignmentId && g.student_id === e.student_id);
        return {
          student_id: e.student_id,
          student_name: student?.name || 'Unknown',
          student_email: student?.email || '',
          score: grade ? grade.score : null,
          feedback: grade ? grade.feedback : '',
          graded_at: grade ? grade.graded_at : null,
        };
      })
      .sort((a, b) => a.student_name.localeCompare(b.student_name));
  },

  setGrade(assignmentId, studentId, { score, feedback }, user) {
    const assignment = data.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error('Assignment not found');
    const course = data.courses.find((c) => c.id === assignment.course_id);
    if (!canManageCourse(course, user)) throw new Error('Access denied');
    if (!isEnrolled(assignment.course_id, studentId)) throw new Error('Student is not enrolled in this course');

    let numericScore = null;
    if (score !== null && score !== undefined && score !== '') {
      numericScore = Number(score);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > assignment.max_score) {
        throw new Error(`Score must be a number between 0 and ${assignment.max_score}`);
      }
    }

    let grade = data.grades.find((g) => g.assignment_id === assignmentId && g.student_id === studentId);
    const now = new Date().toISOString();
    if (grade) {
      grade.score = numericScore;
      grade.feedback = feedback || '';
      grade.graded_at = now;
    } else {
      grade = {
        id: nextId('grades'),
        assignment_id: assignmentId,
        student_id: studentId,
        score: numericScore,
        feedback: feedback || '',
        graded_at: now,
      };
      data.grades.push(grade);
    }
    save();
    return grade;
  },

  getMyResults(studentId) {
    const courseIds = new Set(
      data.enrollments.filter((e) => e.student_id === studentId).map((e) => e.course_id)
    );
    return data.assignments
      .filter((a) => courseIds.has(a.course_id))
      .map((a) => {
        const course = data.courses.find((c) => c.id === a.course_id);
        const grade = data.grades.find((g) => g.assignment_id === a.id && g.student_id === studentId);
        return {
          assignment_id: a.id,
          title: a.title,
          course_id: a.course_id,
          course_title: course?.title || 'Unknown',
          due_date: a.due_date,
          max_score: a.max_score,
          score: grade ? grade.score : null,
          feedback: grade ? grade.feedback : '',
          graded: !!(grade && grade.score != null),
          graded_at: grade ? grade.graded_at : null,
        };
      })
      .sort((a, b) => new Date(b.due_date || 0) - new Date(a.due_date || 0));
  },
};

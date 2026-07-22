# Course Management System

A full-stack web application with **role-based login** for Admin, Teacher, and Student users.

## Features

- **Login system** — Secure authentication with role-based access
- **3 user roles:**
  - **Admin** — Manage courses, students, teachers, and enrollments
  - **Teacher** — Manage own courses and view enrolled students
  - **Student** — Browse courses, enroll/unenroll, view my courses
- **Dashboard** — Role-specific stats and navigation
- **Advanced UI** — Glassmorphism, animations, sidebar layout, gradient accents
- **Search** — Filter courses, students, and teachers by name/email/keyword
- **Course roster** — Admins and teachers can view the enrolled-student list for any course
- **Assignments & Results** — Teachers/admins create assignments per course and grade enrolled students; students see their scores and feedback, plus a consolidated "My Results" view across all their courses
- **CSV export** — Admins can export the current (filtered) courses/students/teachers list
- **Self-service password change** — Any logged-in user can change their own password

## Demo Login Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@edu.com` | `admin123` |
| Teacher | `sarah@edu.com` | `teacher123` |
| Student | `alice@university.edu` | `student123` |

Click a role card on the login page for quick sign-in.

## Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express
- **Auth:** Token-based sessions (salted PBKDF2 password hashing)
- **Database:** JSON file storage

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

### Installation

```bash
cd course-management
npm run install:all
```

### Run the Application

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001

## Role Permissions

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| View all courses | Yes | Own only | Yes |
| Create/edit/delete courses | Yes | Own only | No |
| View course roster | Yes | Own courses only | No |
| Create/edit/delete assignments | Yes | Own courses only | No |
| Grade students | Yes | Own courses only | No |
| View own assignment scores | — | — | Yes |
| Manage students | Yes | View own | No |
| Manage teachers | Yes | No | No |
| Enroll in courses | Yes | No | Yes |
| View my enrollments | — | — | Yes |
| Export CSV | Yes | No | No |
| Change own password | Yes | Yes | Yes |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/auth/change-password` | Yes | Change own password |
| GET | `/api/stats` | Yes | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/courses` | Yes | Course CRUD |
| GET | `/api/courses/:id` | Yes | Course detail + enrolled-student roster |
| GET | `/api/courses/:id/assignments` | Yes | List assignments for a course (with grade info) |
| POST/PUT/DELETE | `/api/assignments` / `/api/assignments/:id` | Admin/Teacher | Assignment CRUD |
| GET | `/api/assignments/:id/grades` | Admin/Teacher | Roster with each student's score/feedback |
| POST | `/api/assignments/:id/grades` | Admin/Teacher | Set/update a student's score and feedback |
| GET | `/api/my-results` | Student | All assignment scores across enrolled courses |
| GET/POST/PUT/DELETE | `/api/students` | Admin/Teacher | Student management |
| GET/POST/PUT/DELETE | `/api/teachers` | Admin | Teacher management |
| GET | `/api/my-enrollments` | Student | Student enrollments |
| POST/DELETE | `/api/enrollments` | Yes | Enroll/unenroll |

## Project Structure

```
course-management/
├── server/
│   ├── index.js       # Express API + auth routes
│   ├── db.js          # Data layer + seed data
│   ├── auth.js        # Password hashing & tokens
│   └── middleware.js  # Auth & role guards
├── client/
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   └── Dashboard.jsx
│       ├── context/
│       │   └── AuthContext.jsx  # also contains the API client
│       └── index.css
└── package.json
```

## Notes

- If upgrading from an older version, delete `server/data.json` to reset with new user accounts.
- Default passwords for newly created students/teachers: `student123` / `teacher123`

## Security fixes applied

- **Password hashing:** switched from plain unsalted SHA-256 to salted PBKDF2 (100,000 iterations), stored as `salt:hash`, verified with a timing-safe comparison. `server/data.json` was regenerated so all demo accounts use the new format.
- **Session expiry:** login tokens now expire after 24 hours instead of lasting forever; expired sessions are cleaned up automatically on the next request that uses them.
- **CORS:** the API now only accepts requests from the Vite dev origin (`http://localhost:5173` by default). Set the `CLIENT_ORIGIN` environment variable if you deploy the frontend elsewhere.

## Bug fixes applied

- The frontend API client (`getStats`, `getCourses`, `getStudents`, `getTeachers`, `getMyEnrollments`) previously didn't match the method names the dashboard actually called (`stats`, `courses`, etc.), which would have thrown `is not a function` errors on load. Names now match.
- `enroll`/`unenroll` previously expected two positional arguments but were always called with a single object — this broke every enroll/unenroll click. Both now take one `{ course_id, student_id }` object, matching how the UI calls them.

## New features added

- **Search bars** on the Courses, Students, and Teachers panels (client-side filtering, no extra requests).
- **Course roster modal** — click "Roster" on any course card (admin/teacher) to see the enrolled students and their enrollment dates, using the existing `/api/courses/:id` endpoint.
- **CSV export** — admins can export the currently filtered courses/students/teachers list to a `.csv` file.
- **Change Password** — available to every role from the sidebar; changing your password invalidates your other active sessions and issues you a fresh one automatically.


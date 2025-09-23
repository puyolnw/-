import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TestPage from './TestPage';
import SimpleLogin from './SimpleLogin';

// Import dashboard pages
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Import profile pages
import StudentProfile from './pages/student/Profile';
import TeacherProfile from './pages/teacher/Profile';
import SupervisorProfile from './pages/supervisor/Profile';
import AdminProfile from './pages/admin/Profile';

// Import teacher pages
import TeacherStudents from './pages/teacher/Students';
import TeacherEvaluations from './pages/teacher/Evaluations';
import TeacherSchool from './pages/teacher/School';
import TeacherMessages from './pages/teacher/Messages';
import TeacherReports from './pages/teacher/Reports';
import StudentDetail from './pages/teacher/StudentDetail';
import TeacherLessonPlans from './pages/teacher/LessonPlans';
import TeacherTeachingSessions from './pages/teacher/TeachingSessions';

// Import supervisor pages
import SupervisorSchools from './pages/supervisor/Schools';
import SupervisorSchoolDetail from './pages/supervisor/SchoolDetail';
import SupervisorStudentDetail from './pages/supervisor/StudentDetail';
import SupervisorEvaluations from './pages/supervisor/Evaluations';
import SupervisorEvaluationDetail from './pages/supervisor/EvaluationDetail';
import SupervisorDetailedEvaluation from './pages/supervisor/DetailedEvaluation';
import SupervisorChat from './pages/supervisor/Chat';
import SupervisorReports from './pages/supervisor/Reports';
import SupervisorLessonPlans from './pages/supervisor/LessonPlans';
import SupervisorTeachingSessions from './pages/supervisor/TeachingSessions';

// Import admin management pages
import UserManagement from './pages/admin/manage/UserManagement';
import SchoolManagement from './pages/admin/manage/SchoolManagement';

// Import new school system pages
import SchoolOverview from './pages/admin/schools/SchoolOverview';
import SchoolDetails from './pages/admin/schools/SchoolDetails';
import SchoolManage from './pages/admin/schools/SchoolManage';
import SchoolEnrollment from './pages/admin/schools/SchoolEnrollment';

// Import admin management pages
import AdminReports from './pages/admin/Reports';
import AdminTeachingSessions from './pages/admin/TeachingSessions';
import AdminEvaluations from './pages/admin/Evaluations';

// Import student school selection
import SchoolSelection from './pages/student/SchoolSelection';
import Registration from './pages/student/Registration';
import LessonPlans from './pages/student/LessonPlans';
import TeachingSessions from './pages/student/TeachingSessions';
import CreateTeachingSession from './pages/student/CreateTeachingSession';
import TeachingSessionDetail from './pages/student/TeachingSessionDetail';
import EditTeachingSession from './pages/student/EditTeachingSession';
import School from './pages/student/School';
import Messages from './pages/student/Messages';
import CompletionRequestStatus from './pages/student/CompletionRequestStatus';

// Import contexts
import { StudentStatusProvider } from './contexts/StudentStatusContext';

function App() {
  return (
    <Router>
      <div className="App">
        <StudentStatusProvider>
          <Routes>
          {/* Test Route */}
          <Route path="/test" element={<TestPage />} />
          <Route path="/simple-login" element={<SimpleLogin />} />
          
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth Routes - Public access */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/profile" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/schools" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <SchoolSelection />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/registration" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Registration />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/lesson-plans" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <LessonPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/teaching-sessions" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TeachingSessions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/teaching-sessions/create" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CreateTeachingSession />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/teaching-sessions/:id" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TeachingSessionDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/teaching-sessions/edit/:id" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <EditTeachingSession />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/school" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <School />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/messages" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Messages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/completion-request" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CompletionRequestStatus />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/*" 
            element={<Navigate to="/student/dashboard" replace />} 
          />

          {/* Teacher Routes */}
          <Route 
            path="/teacher/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/profile" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/students" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherStudents />
              </ProtectedRoute>
            } 
          />
        <Route
          path="/teacher/evaluations"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherEvaluations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/school"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherSchool />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/messages"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/reports"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/lesson-plans"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLessonPlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/teaching-sessions"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherTeachingSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students/:studentId"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <StudentDetail />
            </ProtectedRoute>
          }
        />
          <Route 
            path="/teacher/*" 
            element={<Navigate to="/teacher/dashboard" replace />} 
          />

          {/* Supervisor Routes */}
          <Route 
            path="/supervisor/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/schools" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorSchools />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/schools/:schoolId" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorSchoolDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/students/:studentId" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorStudentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/evaluations" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorEvaluations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/evaluations/:requestId" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorEvaluationDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/evaluations/:requestId/detailed" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorDetailedEvaluation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/lesson-plans" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorLessonPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/teaching-sessions" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorTeachingSessions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/messages" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorChat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/reports" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/profile" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/*" 
            element={<Navigate to="/supervisor/dashboard" replace />} 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/schools" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SchoolManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/teaching-sessions" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTeachingSessions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/evaluations" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEvaluations />
              </ProtectedRoute>
            } 
          />
          
          {/* New School System Routes */}
          <Route 
            path="/admin/schools/overview" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SchoolOverview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/schools/:schoolId/details" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SchoolDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/schools/manage" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SchoolManage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/schools/enrollment" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SchoolEnrollment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={<Navigate to="/admin/dashboard" replace />} 
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </StudentStatusProvider>
      </div>
    </Router>
  );
}

export default App;
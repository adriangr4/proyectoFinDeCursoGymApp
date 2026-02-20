import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/home/HomePage';
import { LibraryPage } from './pages/library/LibraryPage';
import { DietPage } from './pages/diet/DietPage';
import { SocialPage } from './pages/social/SocialPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';

import { ProfilePage } from './pages/profile/ProfilePage';
import { PersonalDataPage } from './pages/profile/PersonalDataPage';
import { WorkoutSessionPage } from './pages/workout/WorkoutSessionPage';
import { RoutineCreatorPage } from './pages/workout/RoutineCreatorPage';
import { HistoryPage } from './pages/tracking/HistoryPage';
import { WorkoutDetailsPage } from './pages/tracking/WorkoutDetailsPage';
import { DailyProgressPage } from './pages/tracking/DailyProgressPage';
import { DietCreatorPage } from './pages/diet/DietCreatorPage';
import { DietDetailsPage } from './pages/diet/DietDetailsPage';

// Placeholder Pages (we will implement them next)

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-white">Cargando...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/community" element={<SocialPage />} />
              <Route path="/diet" element={<DietPage />} />
              <Route path="/diet/create" element={<DietCreatorPage />} />
              <Route path="/diet/:id" element={<DietDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/personal-data" element={<PersonalDataPage />} />
            </Route>
            <Route path="/workout/create" element={<RoutineCreatorPage />} />
            <Route path="/workout/:routineId" element={<WorkoutSessionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:id" element={<WorkoutDetailsPage />} />
            <Route path="/progress" element={<DailyProgressPage />} />
          </Route>


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

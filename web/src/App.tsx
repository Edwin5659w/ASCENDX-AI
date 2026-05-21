import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { BrandLoader } from './components/brand/BrandLoader';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';

const Goals = lazy(() => import('./pages/Goals').then((m) => ({ default: m.Goals })));
const Tasks = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.Tasks })));
const Habits = lazy(() => import('./pages/Habits').then((m) => ({ default: m.Habits })));
const Finance = lazy(() => import('./pages/Finance').then((m) => ({ default: m.Finance })));
const Chat = lazy(() => import('./pages/Chat').then((m) => ({ default: m.Chat })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));

function PageFallback() {
  return <BrandLoader className="min-h-[40vh] flex items-center justify-center" />;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <BrandLoader className="min-h-screen flex items-center justify-center bg-[#0a0a0f]" />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.onboardingDone === false) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <BrandLoader className="min-h-screen flex items-center justify-center bg-[#0a0a0f]" />;
  }
  if (isAuthenticated) {
    if (user?.onboardingDone === false) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function OnboardingRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <BrandLoader className="min-h-screen flex items-center justify-center bg-[#0a0a0f]" />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.onboardingDone) return <Navigate to="/" replace />;
  return <Onboarding />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
        <Route index element={<Dashboard />} />
        <Route
          path="goals"
          element={
            <Suspense fallback={<PageFallback />}>
              <Goals />
            </Suspense>
          }
        />
        <Route
          path="tasks"
          element={
            <Suspense fallback={<PageFallback />}>
              <Tasks />
            </Suspense>
          }
        />
        <Route
          path="habits"
          element={
            <Suspense fallback={<PageFallback />}>
              <Habits />
            </Suspense>
          }
        />
        <Route
          path="finance"
          element={
            <Suspense fallback={<PageFallback />}>
              <Finance />
            </Suspense>
          }
        />
        <Route
          path="chat"
          element={
            <Suspense fallback={<PageFallback />}>
              <Chat />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageFallback />}>
              <Profile />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

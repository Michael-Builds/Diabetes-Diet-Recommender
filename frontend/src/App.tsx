import { Route, Routes } from "react-router-dom";
import BackgroundLayout from "./components/layout/BackgroundLayout";
import Layout from "./components/layout/Layout";
import RequireAuth from "./context/RequireAuth";
import NotFound from "./pages/404/NotFound";
import ForgotPassword from "./pages/auth/forgot-password/ForgotPassword";
import Login from "./pages/auth/login/Login";
import ResetPassword from "./pages/auth/reset-password/ResetPassword";
import Signup from "./pages/auth/signup/Signup";
import VerifyOtp from "./pages/auth/verify-otp/VerifyOtp";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";
import Recommendations from "./pages/recommendations/Recommendations";
import NewMealPlan from "./pages/newMealPlan/NewMealPlan";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <BackgroundLayout>
          <Login />
        </BackgroundLayout>
      } />

      <Route path="/register" element={
        <BackgroundLayout>
          <Signup />
        </BackgroundLayout>
      } />

      <Route path="/forgot-password" element={
        <BackgroundLayout>
          <ForgotPassword />
        </BackgroundLayout>
      } />

      <Route path="/reset-password" element={
        <BackgroundLayout>
          <ResetPassword />
        </BackgroundLayout>
      } />

      <Route path="/verify-otp" element={
        <BackgroundLayout>
          <VerifyOtp />
        </BackgroundLayout>
      } />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Layout>
              <Dashboard />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Layout>
              <Profile />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Layout>
              <Settings />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/recommendations"
        element={
          <RequireAuth>
            <Layout>
              <Recommendations />
            </Layout>
          </RequireAuth>
        }
      />


      <Route
        path="/new-meal-plan"
        element={
          <RequireAuth>
            <Layout>
              <NewMealPlan />
            </Layout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App


import { Route, Routes } from "react-router-dom";
import RequireAuth from "./context/RequireAuth";
import NotFound from "./pages/404/NotFound";
import ForgotPassword from "./pages/auth/forgot-password/ForgotPassword";
import Login from "./pages/auth/login/Login";
import ResetPassword from "./pages/auth/reset-password/ResetPassword";
import Signup from "./pages/auth/signup/Signup";
import VerifyOtp from "./pages/auth/verify-otp/VerifyOtp";
import Home from "./pages/home/Home";
import Profile from "./pages/profile/Profile";
import Splash from "./pages/splash/Splash";
import Layout from "./components/layout/Layout";
import BackgroundLayout from "./components/layout/BackgroundLayout";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={
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

      <Route
        path="/dashboard"
        element={
          // <RequireAuth>
          <Layout>
            <Home />
          </Layout>
          // </RequireAuth>
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App


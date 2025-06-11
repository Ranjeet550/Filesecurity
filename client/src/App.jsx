// React imports
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';


import themeConfig from './theme/themeConfig';

// Pages
import Login from './pages/UserAuth/Login';
import Dashboard from './pages/Filemanagement/Dashboard';
import FileUpload from './pages/Filemanagement/FileUpload';
import FileDownload from './pages/Filemanagement/FileDownload';
import UserManagement from './pages/Usermanagement/Alluser';
import RoleManagement from './pages/Usermanagement/RoleManagement';
import PermissionManagement from './pages/Usermanagement/PermissionManagement';
import NotFound from './components/NotFound';
import ForgotPassword from './pages/UserAuth/ForgotPassword';
import OTPVerification from './pages/UserAuth/OTPVerification';
import ResetPassword from './pages/UserAuth/ResetPassword';
import ChangePassword from './pages/UserAuth/ChangePassword';
import Profile from './pages/UserAuth/Profile';


// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<OTPVerification />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/upload" element={
                <PrivateRoute>
                  <FileUpload />
                </PrivateRoute>
              } />
              <Route path="/change-password" element={
                <PrivateRoute>
                  <ChangePassword />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
             
              <Route path="/download/:fileId" element={<FileDownload />} />
              <Route path="/users" element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } />
              <Route path="/roles" element={
                <AdminRoute>
                  <RoleManagement />
                </AdminRoute>
              } />
              <Route path="/permissions" element={
                <AdminRoute>
                  <PermissionManagement />
                </AdminRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

// Private route component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || (user.role?.name !== 'admin' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default App;

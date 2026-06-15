// React imports
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { useContext } from 'react';

import themeConfig from './theme/themeConfig';
import { storage } from './utils/storage';
import AuthContext from './context/AuthContext';

// Pages
import Login from './pages/UserAuth/Login';
import Dashboard from './pages/Filemanagement/Dashboard';
import FileUpload from './pages/Filemanagement/FileUpload';
import FolderUpload from './pages/Filemanagement/Folderupload';
import FileDownload from './pages/Filemanagement/FileDownload';
import UserManagement from './pages/Usermanagement/Alluser';
import RoleManagement from './pages/Usermanagement/RoleManagement';
import PermissionManagement from './pages/Usermanagement/PermissionManagement';
import ModuleManagement from './pages/Usermanagement/ModuleManagement';
import SystemLogs from './pages/Usermanagement/SystemLogs';
import ActivitiesLog from './pages/Usermanagement/ActivitiesLog';
import NotFound from './components/NotFound';
import ForgotPassword from './pages/UserAuth/ForgotPassword';
import OTPVerification from './pages/UserAuth/OTPVerification';
import ResetPassword from './pages/UserAuth/ResetPassword';
import ChangePassword from './pages/UserAuth/ChangePassword';
import Profile from './pages/UserAuth/Profile';
import Configuration from './pages/Settings/Configuration';
import Groupimage from './pages/Settings/Groupimage';
import Session from './pages/Settings/Session';


// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

// Separate component to use AuthContext
function AppRoutes() {
  const { user, token, loading, sessionExpired } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px'
      }}>
        Loading...
      </div>
    );
  }

  // Show session expired message
  if (sessionExpired) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ff4d4f', marginBottom: '16px' }}>Session Expired</h2>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          Your session has expired due to inactivity or timeout. Please login again.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={
          <PrivateRoute user={user} token={token}>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/upload" element={
          <PermissionRoute user={user} token={token} moduleName="file_management" action="create">
            <FileUpload />
          </PermissionRoute>
        } />
        <Route path="/file-upload" element={
          <PermissionRoute user={user} token={token} moduleName="file_management" action="create">
            <FileUpload />
          </PermissionRoute>
        } />
        <Route path="/folder-upload" element={
          <PermissionRoute user={user} token={token} moduleName="file_management" action="create">
            <FolderUpload />
          </PermissionRoute>
        } />
        <Route path="/change-password" element={
          <PrivateRoute user={user} token={token}>
            <ChangePassword />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute user={user} token={token}>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PermissionRoute user={user} token={token} moduleName="settings" action="read">
            <Configuration />
          </PermissionRoute>
        } />
        <Route path="/group-images" element={
          <PermissionRoute user={user} token={token} moduleName="settings" action="read">
            <Groupimage />
          </PermissionRoute>
        } />
        <Route path="/session-settings" element={
          <PermissionRoute user={user} token={token} moduleName="settings" action="read">
            <Session />
          </PermissionRoute>
        } />

        <Route path="/download/:fileId" element={<FileDownload />} />
        <Route path="/users" element={
          <AdminRoute user={user} token={token}>
            <UserManagement />
          </AdminRoute>
        } />
        <Route path="/roles" element={
          <AdminRoute user={user} token={token}>
            <RoleManagement />
          </AdminRoute>
        } />
        <Route path="/permissions" element={
          <AdminRoute user={user} token={token}>
            <PermissionManagement />
          </AdminRoute>
        } />
        <Route path="/modules" element={
          <AdminRoute user={user} token={token}>
            <ModuleManagement />
          </AdminRoute>
        } />
        <Route path="/system-logs" element={
          <SuperAdminRoute user={user} token={token}>
            <SystemLogs />
          </SuperAdminRoute>
        } />
        <Route path="/activities" element={
          <SuperAdminRoute user={user} token={token}>
            <ActivitiesLog />
          </SuperAdminRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// Private route component
const PrivateRoute = ({ children, user, token }) => {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin route component
const AdminRoute = ({ children, user, token }) => {
  if (!token || !user || (user.role?.name !== 'admin' && user.role?.name !== 'superadmin' && user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// SuperAdmin route component (only for superadmin)
const SuperAdminRoute = ({ children, user, token }) => {
  const isSuperAdmin = user?.role?.name === 'superadmin' || 
                       user?.role === 'superadmin' ||
                       (typeof user?.role === 'object' && user?.role?.name === 'superadmin');
  
  if (!token || !user || !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Permission-based route component
const PermissionRoute = ({ children, user, token, moduleName, action }) => {
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission from user context
  const hasPerm = Array.isArray(user?.role?.permissions)
    ? user.role.permissions.some(
        (p) => p?.module?.name === moduleName && p?.action === action && p?.isActive !== false
      )
    : false;

  if (user?.role?.name === 'admin' || user?.role === 'superadmin') {
    return children;
  }

  if (!hasPerm) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default App;

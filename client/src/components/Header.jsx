import { Button, Avatar, Dropdown, Grid, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const { useBreakpoint } = Grid;

const Header = ({ collapsed, setCollapsed, onMobileMenuClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const {
    token: { colorPrimary },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'change-password',
      label: 'Change Password',
      icon: <LockOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const handleMenuClick = (e) => {
    if (e.key === 'logout') {
      handleLogout();
    } else if (e.key === 'change-password') {
      navigate('/change-password');
    } else if (e.key === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <div
      className="app-header"
      style={{
        padding: '0 24px',
        background: '#ffffff',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
       
        minHeight: '64px',
        position: 'relative',
        zIndex: 100,
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        borderLeft: screens.md ? '1px solid rgba(0, 0, 0, 0.06)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => {
            if (window.innerWidth < 768) {
              onMobileMenuClick();
            } else {
              setCollapsed(!collapsed);
            }
          }}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
          }}
        />
        <h2 style={{
          margin: '0 0 0 16px',
          fontSize: '18px',
          fontWeight: '600',
          display: screens.xs ? 'none' : 'block',
          color: '#1a2141'
        }}>
          {location.pathname === '/dashboard' && !location.search.includes('view=all-files') && 'Dashboard'}
          {location.pathname === '/upload' && 'Upload File'}
          {location.pathname === '/users' && 'User Management'}
          {location.pathname === '/change-password' && 'Change Password'}
          {location.pathname === '/profile' && 'My Profile'}
          {location.pathname === '/dashboard' && location.search.includes('view=all-files') && 'All Files'}
        </h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleMenuClick,
          }}
          placement="bottomRight"
        >
          <div style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '6px 12px',
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.04)',
            }
          }}>
            <Avatar
              style={{
                backgroundColor: user?.profilePicture ? 'transparent' : colorPrimary,
                marginRight: '12px',
                boxShadow: '0 2px 8px rgba(0, 191, 150, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              size={screens.xs ? 'default' : 36}
              src={user?.profilePicture ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.profilePicture}` : null}
              onError={() => {
                console.log('Avatar image failed to load in header');
              }}
            >
              {!user?.profilePicture && user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{
              display: screens.xs ? 'none' : 'block',
              marginRight: '4px'
            }}>
              <div style={{
                fontWeight: '600',
                fontSize: '14px',
                lineHeight: '1.2'
              }}>{user?.name}</div>
              <div style={{
                fontSize: '12px',
                color: '#8c8c8c',
                lineHeight: '1.2'
              }}>{user?.role?.displayName || user?.role?.name || user?.role}</div>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default Header; 
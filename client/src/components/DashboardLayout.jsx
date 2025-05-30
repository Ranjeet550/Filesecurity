import { useState, useContext, useEffect } from 'react';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Badge, Grid, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  FileOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  SecurityScanOutlined,
  BellOutlined,
  SettingOutlined,
  LockOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  // Determine the active menu key based on both pathname and search params
  const getActiveMenuKey = () => {
    const activeKey = location.pathname === '/dashboard' && location.search.includes('view=all-files')
      ? '/all-files'
      : location.pathname;

    console.log('Active menu key:', activeKey, 'Path:', location.pathname, 'Search:', location.search);
    return activeKey;
  };

  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();

  // Auto collapse sidebar on small screens
  useEffect(() => {
    setCollapsed(!screens.md);
  }, [screens.md]);

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
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
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
    } else if (e.key === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <Layout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="app-sider"
        style={{
          background: 'linear-gradient(180deg, #1a2141 0%, #141937 100%)',
          boxShadow: '2px 0 15px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          position: 'fixed',
          height: '100vh',
          zIndex: 1000,
          left: collapsed && !screens.md ? '-80px' : 0,
          overflow: 'auto',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)'
        }}
        breakpoint="lg"
        width={250}
      >
        <div className="app-logo" style={{
          height: '64px',
          margin: '0',
          color: 'white',
          background: 'linear-gradient(90deg, #141937 0%, #1a2141 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: collapsed ? '20px' : '18px',
          fontWeight: 'bold',
          padding: '0 16px',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}>
          <SecurityScanOutlined style={{
            fontSize: '24px',
            marginRight: collapsed ? '0' : '12px',
            transition: 'all 0.3s ease',
            color: '#00BF96'
          }} />
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Secure File Transfer</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getActiveMenuKey()]}
          style={{
            background: 'transparent',
            borderRight: 0,
            padding: '12px 8px'
          }}
          items={[
            {
              key: '/dashboard',
              icon: <DashboardOutlined style={{ fontSize: '16px' }} />,
              label: <Link to="/dashboard" style={{ fontWeight: '500' }}>Dashboard</Link>,
            },
            {
              key: '/all-files',
              icon: <AppstoreOutlined style={{ fontSize: '16px' }} />,
              label: <Link to="/dashboard?view=all-files" style={{ fontWeight: '500' }}>All Files</Link>,
            },
            {
              key: '/upload',
              icon: <UploadOutlined style={{ fontSize: '16px' }} />,
              label: <Link to="/upload" style={{ fontWeight: '500' }}>Upload File</Link>,
            },

            ...(user?.role === 'admin' ? [
              {
                key: '/users',
                icon: <TeamOutlined style={{ fontSize: '16px' }} />,
                label: <Link to="/users" style={{ fontWeight: '500' }}>User Management</Link>,
              },
            ] : []),
          ]}
        />
      </Sider>
      <Layout style={{
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          marginLeft: screens.md ? (collapsed ? 80 : 250) : 0
        }}>
        <Header
          className="app-header"
          style={{
            padding: '0 24px',
            background: '#ffffff',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 40,
                height: 40,
                color: colorPrimary,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                background: 'rgba(0, 191, 150, 0.05)'
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
              {location.pathname === '/settings' && 'Settings'}
              {location.pathname === '/dashboard' && location.search.includes('view=all-files') && 'All Files'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <Badge count={0} dot>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{
                    fontSize: '16px',
                    width: 40,
                    height: 40,
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.02)'
                  }}
                />
              </Badge>
            </Tooltip>

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
                    // The fallback to showing the user initial is handled automatically by Ant Design
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
                  }}>{user?.role}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content" style={{
          padding: screens.sm ? '20px' : '12px',
          transition: 'padding 0.3s ease',
          background: 'rgba(245, 245, 245, 0.5)'
        }}>
          <div
            style={{
              padding: screens.sm ? 24 : 16,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(0, 0, 0, 0.02)'
            }}
          >
            {children}
          </div>
        </Content>
       
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

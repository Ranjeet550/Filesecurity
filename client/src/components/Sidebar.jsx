import { useState, useContext, useEffect } from 'react';
import { Layout, Menu, theme, Grid } from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  DashboardOutlined,
  TeamOutlined,
  SecurityScanOutlined,
  AppstoreOutlined,
  SafetyOutlined,
  KeyOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Header from './Header';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

// Table styles object
const tableStyles = {
  table: {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  thead: {
    background: '#fafafa',
    fontWeight: 600,
    color: '#1a2141',
    padding: '16px',
    borderBottom: '2px solid #f0f0f0',
  },
  tbody: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  hoverRow: {
    background: '#f5f5f5',
  },
  lastRow: {
    borderBottom: 'none',
  },
};

const Sidebar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useContext(AuthContext);
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
    token: { colorBgContainer },
  } = theme.useToken();

  // Auto collapse sidebar on small screens
  useEffect(() => {
    setCollapsed(!screens.md);
  }, [screens.md]);

  return (
    <Layout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="app-sider"
        style={{
          background: 'linear-gradient(180deg, #1a2141 0%, #141937 100%)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          position: 'fixed',
          height: '100vh',
          top: 0,
          left: collapsed && !screens.md ? '-80px' : 0,
          zIndex: 1001,
          overflow: 'hidden',
          borderRight: '2px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
        breakpoint="lg"
        width={250}
      >
        <div className="app-logo" style={{
          height: '64px',
          minHeight: '64px',
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
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          flexShrink: 0
        }}>
          <SecurityScanOutlined style={{
            fontSize: '24px',
            marginRight: collapsed ? '0' : '12px',
            transition: 'all 0.3s ease',
            color: '#00BF96'
          }} />
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Secure File Transfer</span>}
        </div>
        <div style={{
          flex: 1,
          overflow: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
        }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getActiveMenuKey()]}
            style={{
              background: 'transparent',
              borderRight: 0,
              padding: '12px 8px',
              height: '100%'
            }}
          items={[
            {
              key: '/dashboard',
              icon: <DashboardOutlined style={{ fontSize: '16px' }} />,
              label: <Link to="/dashboard" style={{ fontWeight: '500' }}>Dashboard</Link>,
            },
            {
              key: 'file-management',
              icon: <FileOutlined style={{ fontSize: '16px' }} />,
              label: 'File Management',
              children: [
                {
                  key: '/upload',
                  icon: <UploadOutlined style={{ fontSize: '14px' }} />,
                  label: <Link to="/upload" style={{ fontWeight: '500' }}>Upload File</Link>,
                },
                {
                  key: '/all-files',
                  icon: <AppstoreOutlined style={{ fontSize: '14px' }} />,
                  label: <Link to="/dashboard?view=all-files" style={{ fontWeight: '500' }}>All Files</Link>,
                }
              ]
            },

            ...(user?.role?.name === 'admin' ? [
              {
                key: 'user-management',
                icon: <TeamOutlined style={{ fontSize: '16px' }} />,
                label: 'User Management',
                children: [
                  {
                    key: '/users',
                    icon: <UserOutlined style={{ fontSize: '14px' }} />,
                    label: <Link to="/users" style={{ fontWeight: '500' }}>Users</Link>,
                  },
                  {
                    key: '/roles',
                    icon: <SafetyOutlined style={{ fontSize: '14px' }} />,
                    label: <Link to="/roles" style={{ fontWeight: '500' }}>Roles</Link>,
                  },
                  {
                    key: '/permissions',
                    icon: <KeyOutlined style={{ fontSize: '14px' }} />,
                    label: <Link to="/permissions" style={{ fontWeight: '500' }}>Permissions</Link>,
                  }
                ]
              },
            ] : []),
          ]}
          />
        </div>
      </Sider>
      <Layout style={{
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          marginLeft: screens.md ? (collapsed ? 80 : 250) : 0,
          minHeight: '100vh'
        }}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content className="app-content" style={{
          padding: screens.sm ? '20px' : '12px',
          transition: 'padding 0.3s ease',
          background: 'rgba(245, 245, 245, 0.5)',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}>
          <div
            style={{
              padding: screens.sm ? 24 : 16,
              minHeight: 'calc(100vh - 128px)',
              background: colorBgContainer,
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(0, 0, 0, 0.02)',
              ...tableStyles.table
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;

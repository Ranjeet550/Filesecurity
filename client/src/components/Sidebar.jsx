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
  UserOutlined,
  CodeOutlined,
  FolderOpenOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { hasPermission, isAdmin } from '../utils/permissions';
import Header from './Header';
import './Sidebar.css';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;



const Sidebar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const screens = useBreakpoint();

  // Determine the active menu key based on both pathname and search params
  const getActiveMenuKey = () => {
    const activeKey = location.pathname === '/dashboard' && location.search.includes('view=all-files')
      ? '/all-files'
      : location.pathname;

   
    return activeKey;
  };

  // Determine which parent menus should be open based on current route
  const getDefaultOpenKeys = () => {
    const pathname = location.pathname;
    const search = location.search;
    
    const openKeys = [];
    
    // File Management submenu
    if (pathname === '/upload' || pathname === '/file-upload' || pathname === '/folder-upload' || (pathname === '/dashboard' && search.includes('view=all-files'))) {
      openKeys.push('file-management');
    }
    
    // User Management submenu (admin only)
    if (pathname === '/users' || pathname === '/roles' || pathname === '/permissions' || pathname === '/modules') {
      openKeys.push('user-management');
    }
    
    return openKeys;
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Auto collapse sidebar on small screens
  useEffect(() => {
    setCollapsed(!screens.md);
  }, [screens.md]);

  // Set initial open keys based on current route
  useEffect(() => {
    const defaultOpenKeys = getDefaultOpenKeys();
    setOpenKeys(defaultOpenKeys);
  }, [location.pathname, location.search]);

  // Handle menu open/close
  const handleOpenChange = (keys) => {
    // If sidebar is collapsed, don't allow opening submenus
    if (collapsed) {
      setOpenKeys([]);
      return;
    }
    
    // Find the latest opened key
    const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1);
    
    // If no new key is opened, just close the menu
    if (!latestOpenKey) {
      setOpenKeys(keys);
      return;
    }
    
    // Define root submenu keys
    const rootSubmenuKeys = ['file-management', 'user-management'];
    
    // If the latest opened key is a root submenu
    if (rootSubmenuKeys.includes(latestOpenKey)) {
      // Close other submenus and open the new one
      setOpenKeys([latestOpenKey]);
    } else {
      // For non-root keys, just update the open keys
      setOpenKeys(keys);
    }
  };

  // Reset open keys when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
    } else {
      // Restore open keys when sidebar expands
      const defaultOpenKeys = getDefaultOpenKeys();
      setOpenKeys(defaultOpenKeys);
    }
  }, [collapsed]);

  return (
    <Layout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          height: '100vh',
          top: 0,
          left: collapsed && !screens.md ? '-80px' : 0,
          zIndex: 1001,
          overflow: 'hidden'
        }}
        breakpoint="lg"
        width={250}
      >
        <div className="app-logo" style={{
          fontSize: collapsed ? '20px' : '18px'
        }}>
          <SecurityScanOutlined style={{
            fontSize: '24px',
            marginRight: collapsed ? '0' : '12px',
            transition: 'all 0.3s ease',
            color: '#00BF96'
          }} />
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Secure File Transfer</span>}
        </div>
        <div className="sidebar-menu-container">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getActiveMenuKey()]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}

            items={[
              {
                key: '/dashboard',
                icon: <DashboardOutlined style={{ fontSize: '16px', color: '#00BF96' }} />,
                label: (
                  <Link to="/dashboard" className="sidebar-menu-link">
                    Dashboard
                  </Link>
                )
              },
              {
                key: 'file-management',
                icon: <FileOutlined style={{ fontSize: '16px', color: '#00BF96' }} />,
                label: <span className="sidebar-menu-link">File Management</span>,
                children: [
                  // Show Upload only if user has create permission on file_management
                  ...(hasPermission(user, 'file_management', 'create') ? [{
                    key: '/upload',
                    icon: <UploadOutlined style={{ fontSize: '14px', color: '#52c41a' }} />,
                    label: (
                      <Link to="/upload" className="sidebar-submenu-link">
                        Upload File
                      </Link>
                    )
                  }] : []),
                  // Show Folder Upload only if user has create permission on file_management
                  ...(hasPermission(user, 'file_management', 'create') ? [{
                    key: '/folder-upload',
                    icon: <FolderOpenOutlined style={{ fontSize: '14px', color: '#fa8c16' }} />,
                    label: (
                      <Link to="/folder-upload" className="sidebar-submenu-link">
                        Bulk Upload
                      </Link>
                    )
                  }] : []),
                  // Show All Files for superadmin and admin roles
                  ...((user?.role?.name === 'superadmin' || user?.role?.name === 'admin') ? [{
                    key: '/all-files',
                    icon: <AppstoreOutlined style={{ fontSize: '14px', color: '#1890ff' }} />,
                    label: (
                      <Link to="/dashboard?view=all-files" className="sidebar-submenu-link">
                        All Files
                      </Link>
                    )
                  }] : [])
                ]
              },

              ...(user?.role?.name === 'superadmin' || user?.role?.name === 'admin' ? [
                {
                  key: 'user-management',
                  icon: <TeamOutlined style={{ fontSize: '16px', color: '#00BF96' }} />,
                  label: <span className="sidebar-menu-link">User Management</span>,
                  children: [
                    // Users submenu - visible for both admin and superadmin
                    {
                      key: '/users',
                      icon: <UserOutlined style={{ fontSize: '14px', color: '#722ed1' }} />,
                      label: (
                        <Link to="/users" className="sidebar-submenu-link">
                          Users
                        </Link>
                      )
                    },
                    // Roles, Permissions, and Modules - only visible for superadmin
                    ...(user?.role?.name === 'superadmin' ? [
                      {
                        key: '/roles',
                        icon: <SafetyOutlined style={{ fontSize: '14px', color: '#fa8c16' }} />,
                        label: (
                          <Link to="/roles" className="sidebar-submenu-link">
                            Roles
                          </Link>
                        )
                      },
                      {
                        key: '/permissions',
                        icon: <KeyOutlined style={{ fontSize: '14px', color: '#eb2f96' }} />,
                        label: (
                          <Link to="/permissions" className="sidebar-submenu-link">
                            Permissions
                          </Link>
                        )
                      },
                      {
                        key: '/modules',
                        icon: <CodeOutlined style={{ fontSize: '14px', color: '#13c2c2' }} />,
                        label: (
                          <Link to="/modules" className="sidebar-submenu-link">
                            Modules
                          </Link>
                        )
                      }
                    ] : [])
                  ]
                },
              ] : []),

              // Settings menu item (for superadmin and admin)
              ...(user?.role?.name === 'superadmin' || user?.role?.name === 'admin' ? [{
                key: '/settings',
                icon: <SettingOutlined style={{ fontSize: '16px', color: '#00BF96' }} />,
                label: (
                  <Link to="/settings" className="sidebar-menu-link">
                    Settings
                  </Link>
                )
              }] : []),

              // System Management menu item (only for superadmin)
              ...(user?.role?.name === 'superadmin' ? [{
                key: 'system-management',
                icon: <SettingOutlined style={{ fontSize: '16px', color: '#00BF96' }} />,
                label: <span className="sidebar-menu-link">System Management</span>,
                children: [
                  {
                    key: '/activities',
                    icon: <FileOutlined style={{ fontSize: '14px', color: '#faad14' }} />,
                    label: (
                      <Link to="/activities" className="sidebar-submenu-link">
                        Activities
                      </Link>
                    )
                  },
                  {
                    key: '/system-logs',
                    icon: <CodeOutlined style={{ fontSize: '14px', color: '#13c2c2' }} />,
                    label: (
                      <Link to="/system-logs" className="sidebar-submenu-link">
                        System Logs
                      </Link>
                    )
                  }
                ]
              }] : []),
            ]}
          />
        </div>
      </Sider>
      <Layout style={{
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          marginLeft: screens.md ? (collapsed ? 80 : 250) : 0,
          minHeight: '100vh',
          paddingTop: '64px'
        }}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} onMobileMenuClick={() => setCollapsed(false)} />
        <Content className="app-content" style={{
          padding: screens.sm ? '20px' : '12px',
          transition: 'padding 0.3s ease',

          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}
        onClick={() => {
          // Close sidebar on mobile when clicking outside
          if (!screens.md && !collapsed) {
            setCollapsed(true);
          }
        }}>
          <div

          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;

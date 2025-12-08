import { Button, Avatar, Dropdown, Grid, theme, Image } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { getAllGroupImages } from '../api/settingsService';
import { storage } from '../utils/storage';

const { useBreakpoint } = Grid;

const Header = ({ collapsed, setCollapsed, onMobileMenuClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const {
    token: { colorPrimary },
  } = theme.useToken();

  const [groupImageUrl, setGroupImageUrl] = useState(null);
  const [groupImages, setGroupImages] = useState({});

  useEffect(() => {
    // Fetch all group images
    const fetchGroupImages = async () => {
      try {
        const response = await getAllGroupImages();
        const images = {};

        // Create object URLs for each group image
        for (const [groupName, imageData] of Object.entries(response.data)) {
          try {
            // Fetch the image as blob
            const imageResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/group-image/${groupName}`, {
              headers: {
                'Authorization': `Bearer ${storage.getToken()}`
              }
            });

            if (imageResponse.ok) {
              const blob = await imageResponse.blob();
              images[groupName] = URL.createObjectURL(blob);
            }
          } catch (error) {
            console.error(`Failed to load image for group ${groupName}:`, error);
          }
        }

        setGroupImages(images);
      } catch (error) {
        console.error('Error fetching group images:', error);
      }
    };

    fetchGroupImages();

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(groupImages).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    // Set group image URL if user has a group
    if (user?.group && groupImages[user.group]) {
      setGroupImageUrl(groupImages[user.group]);
    } else {
      setGroupImageUrl(null);
    }
  }, [user?.group, groupImages]);

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
        margin: 0,
        padding: '0 24px',
        background: 'linear-gradient(180deg, #1a2141 0%, #141937 100%)',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px',
        minHeight: '64px',
        position: 'fixed',
        top: 0,
        left: screens.md ? (collapsed ? 80 : 250) : 0,
        right: 0,
        zIndex: 100,
        borderRight: '2px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
        width: screens.md ? `calc(100% - ${collapsed ? 80 : 250}px)` : '100%'
      }}
    >
      {/* Left side - Menu button and route name */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => {
            if (window.innerWidth < 768) {
              onMobileMenuClick && onMobileMenuClick();
            } else {
              setCollapsed(!collapsed);
            }
          }}
          style={{
            fontSize: '18px',
            width: 48,
            height: 48,
            color: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.3s ease',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#00BF96';
            e.target.style.background = 'rgba(0, 191, 150, 0.15)';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.borderColor = 'rgba(0, 191, 150, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'rgba(255, 255, 255, 0.9)';
            e.target.style.background = 'transparent';
            e.target.style.transform = 'scale(1)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        />
        <h2 style={{
          margin: '0 0 0 20px',
          fontSize: '20px',
          fontWeight: '700',
          display: screens.xs ? 'none' : 'block',
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          letterSpacing: '0.5px'
        }}>
          {location.pathname === '/dashboard' && !location.search.includes('view=all-files') && 'Dashboard'}
          {location.pathname === '/upload' && 'Upload File'}
          {location.pathname === '/file-upload' && 'Single File Upload'}
          {location.pathname === '/folder-upload' && 'Folder Upload'}
          {location.pathname === '/users' && 'Users'}
          {location.pathname === '/roles' && 'Roles'}
          {location.pathname === '/permissions' && 'Permissions'}
          {location.pathname === '/modules' && 'Modules'}
          {location.pathname === '/settings' && 'Settings'}
          {location.pathname === '/group-images' && 'Group Images'}
          {location.pathname.startsWith('/download/') && 'Download File'}

          {location.pathname === '/change-password' && 'Change Password'}
          {location.pathname === '/profile' && 'My Profile'}
          {location.pathname === '/dashboard' && location.search.includes('view=all-files') && 'All Files'}
        </h2>
      </div>

      {/* Center - Group image */}
      {groupImageUrl && (
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Image
            src={groupImageUrl}
            alt={`${user?.group} group image`}
            style={{
              width: '70px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            preview={false}
            onError={() => setGroupImageUrl(null)}
          />
        </div>
      )}
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
            padding: '4px 6px',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 191, 150, 0.2) 0%, rgba(0, 191, 150, 0.1) 100%)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(0, 191, 150, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}>
            <Avatar
              style={{
                backgroundColor: user?.profilePicture ? 'transparent' : '#00BF96',
                marginRight: '14px',
                boxShadow: '0 4px 15px rgba(0, 191, 150, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '16px'
              }}
              size={screens.xs ? 'default' : 40}
              src={user?.profilePicture ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.profilePicture}` : null}
              onError={() => {
                console.log('Avatar image failed to load in header');
              }}
            >
              {!user?.profilePicture && user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{
              display: screens.xs ? 'none' : 'block',
              marginRight: '8px'
            }}>
              <div style={{
                fontWeight: '700',
                fontSize: '15px',
                lineHeight: '1.3',
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}>{user?.name}</div>
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.2',
                fontWeight: '500'
              }}>{user?.role?.displayName || user?.role?.name || user?.role}</div>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default Header; 
import { useState, useContext } from 'react';
import {
  Typography,
  Card,
  Switch,
  List,
  Button,
  Divider,
  Row,
  Col,
  Tabs,
  Alert,
  Space,
  App
} from 'antd';
import {
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  EyeOutlined,
  LockOutlined,
  DeleteOutlined,
  LogoutOutlined,
  WarningOutlined,
  BulbOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AuthContext from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  
  // These settings would typically be stored in the user's profile
  // For now, we'll use local state as placeholders
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      loginAlerts: true,
      fileDownloadAlerts: true
    },
    security: {
      twoFactorAuth: false,
      passwordExpiry: true,
      activityLogging: true
    },
    appearance: {
      darkMode: false,
      compactMode: false
    }
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    
    message.success(`Setting updated: ${setting}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showDeleteAccountConfirm = () => {
    modal.confirm({
      title: 'Are you sure you want to delete your account?',
      icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      content: 'This action cannot be undone. All your data will be permanently deleted.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        message.info('Account deletion would be implemented here');
      }
    });
  };

  return (
    <Sidebar >
      <div className="settings-container">
        <Title level={2} style={{ marginBottom: '24px' }}>
          <SettingOutlined style={{ marginRight: '12px' }} />
          Settings
        </Title>

        <Tabs defaultActiveKey="1" type="card">
          <TabPane 
            tab={
              <span>
                <BellOutlined /> Notifications
              </span>
            } 
            key="1"
          >
            <Card className="settings-card">
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    title: 'Email Alerts',
                    description: 'Receive email notifications for important events',
                    setting: 'emailAlerts',
                    category: 'notifications'
                  },
                  {
                    title: 'Login Alerts',
                    description: 'Get notified when someone logs into your account',
                    setting: 'loginAlerts',
                    category: 'notifications'
                  },
                  {
                    title: 'File Download Alerts',
                    description: 'Receive notifications when your files are downloaded',
                    setting: 'fileDownloadAlerts',
                    category: 'notifications'
                  }
                ]}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Switch 
                        checked={settings[item.category][item.setting]} 
                        onChange={(checked) => handleSettingChange(item.category, item.setting, checked)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <SecurityScanOutlined /> Security
              </span>
            } 
            key="2"
          >
            <Card className="settings-card">
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    title: 'Two-Factor Authentication',
                    description: 'Add an extra layer of security to your account',
                    setting: 'twoFactorAuth',
                    category: 'security'
                  },
                  {
                    title: 'Password Expiry',
                    description: 'Require password change every 90 days',
                    setting: 'passwordExpiry',
                    category: 'security'
                  },
                  {
                    title: 'Activity Logging',
                    description: 'Keep detailed logs of account activity',
                    setting: 'activityLogging',
                    category: 'security'
                  }
                ]}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Switch 
                        checked={settings[item.category][item.setting]} 
                        onChange={(checked) => handleSettingChange(item.category, item.setting, checked)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  icon={<LockOutlined />} 
                  onClick={() => navigate('/change-password')}
                  style={{ width: '100%' }}
                >
                  Change Password
                </Button>
              </Space>
            </Card>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <EyeOutlined /> Appearance
              </span>
            } 
            key="3"
          >
            <Card className="settings-card">
              <Alert
                message="Theme Settings"
                description="These settings are for demonstration purposes only and don't affect the actual application theme yet."
                type="info"
                showIcon
                icon={<BulbOutlined />}
                style={{ marginBottom: '24px' }}
              />
              
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    title: 'Dark Mode',
                    description: 'Use dark theme throughout the application',
                    setting: 'darkMode',
                    category: 'appearance'
                  },
                  {
                    title: 'Compact Mode',
                    description: 'Use more compact layout to fit more content',
                    setting: 'compactMode',
                    category: 'appearance'
                  }
                ]}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Switch 
                        checked={settings[item.category][item.setting]} 
                        onChange={(checked) => handleSettingChange(item.category, item.setting, checked)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <ThunderboltOutlined /> Account
              </span>
            } 
            key="4"
          >
            <Card className="settings-card">
              <Paragraph>
                Manage your account settings and connected services.
              </Paragraph>
              
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card 
                    type="inner" 
                    title="Account Actions" 
                    style={{ marginBottom: '24px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button 
                        icon={<LogoutOutlined />} 
                        onClick={handleLogout}
                        style={{ width: '100%' }}
                      >
                        Logout
                      </Button>
                      
                      <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={showDeleteAccountConfirm}
                        style={{ width: '100%' }}
                      >
                        Delete Account
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </Sidebar >
  );
};

export default Settings;

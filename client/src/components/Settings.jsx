import { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Switch,
  Button,
  Row,
  Col,
  Tabs,
  Space,
  App,
  Input,
  InputNumber,
  Select,
  Spin
} from 'antd';
import {
  SettingOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  FileProtectOutlined,
  MailOutlined,
  GlobalOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import Sidebar from './Sidebar';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Settings = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  // Application management settings state
  const [appSettings, setAppSettings] = useState({
    database: {
      connectionString: 'mongodb+srv://Ranjeet:SoGEUgDZSFEIZmrC@cluster0.txsr4.mongodb.net/safefile',
      maxConnections: 100,
      connectionTimeout: 30000,
      enableLogging: true
    },
    security: {
      jwtExpiration: '30d',
      passwordMinLength: 6,
      maxLoginAttempts: 5,
      sessionTimeout: 3600,
      enableTwoFactor: false,
      requirePasswordChange: false
    },
    fileManagement: {
      maxFileSize: 0, // 0 means unlimited
      allowedFileTypes: ['*'], // * means all types
      enablePasswordProtection: true,
      defaultPasswordStrength: 'medium',
      enableFileExpiration: false,
      storageLocation: './uploads'
    },
    email: {
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@safefile.com',
      enableEmailNotifications: true
    },
    system: {
      appName: 'Secure File Transfer',
      appVersion: '1.0.0',
      maintenanceMode: false,
      enableRegistration: true,
      enableGuestAccess: false,
      logLevel: 'info'
    }
  });

  useEffect(() => {
    // Load current application settings
    loadAppSettings();
  }, []);

  const loadAppSettings = async () => {
    setLoading(true);
    try {
      // In a real application, this would fetch from an API
      // For now, we'll use the default settings
      message.success('Application settings loaded');
    } catch (error) {
      message.error('Failed to load application settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    setAppSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real application, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      message.success('Application settings saved successfully');
    } catch (error) {
      message.error('Failed to save application settings');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    setAppSettings({
      database: {
        connectionString: 'mongodb+srv://Ranjeet:SoGEUgDZSFEIZmrC@cluster0.txsr4.mongodb.net/safefile',
        maxConnections: 100,
        connectionTimeout: 30000,
        enableLogging: true
      },
      security: {
        jwtExpiration: '30d',
        passwordMinLength: 6,
        maxLoginAttempts: 5,
        sessionTimeout: 3600,
        enableTwoFactor: false,
        requirePasswordChange: false
      },
      fileManagement: {
        maxFileSize: 0,
        allowedFileTypes: ['*'],
        enablePasswordProtection: true,
        defaultPasswordStrength: 'medium',
        enableFileExpiration: false,
        storageLocation: './uploads'
      },
      email: {
        smtpHost: 'smtp.ethereal.email',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: 'noreply@safefile.com',
        enableEmailNotifications: true
      },
      system: {
        appName: 'Secure File Transfer',
        appVersion: '1.0.0',
        maintenanceMode: false,
        enableRegistration: true,
        enableGuestAccess: false,
        logLevel: 'info'
      }
    });
    message.info('Settings reset to defaults');
  };

  return (
    <Sidebar>
      <div style={{ padding: '24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <SettingOutlined style={{ marginRight: '12px' }} />
              Application Management Settings
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={resetSettings}
                style={{ fontSize: '12px', height: '32px' }}
              >
                Reset to Defaults
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveSettings}
                loading={loading}
                style={{ fontSize: '12px', height: '32px' }}
              >
                Save Settings
              </Button>
            </Space>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Tabs defaultActiveKey="1" type="card" size="small">
            <TabPane
              tab={
                <span style={{ fontSize: '12px' }}>
                  <DatabaseOutlined /> Database
                </span>
              }
              key="1"
            >
              <Card size="small">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Connection String:</label>
                    <Input
                      value={appSettings.database.connectionString}
                      onChange={(e) => handleSettingChange('database', 'connectionString', e.target.value)}
                      placeholder="MongoDB connection string"
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Max Connections:</label>
                    <InputNumber
                      value={appSettings.database.maxConnections}
                      onChange={(value) => handleSettingChange('database', 'maxConnections', value)}
                      min={1}
                      max={1000}
                      style={{ width: '100%', fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Connection Timeout (ms):</label>
                    <InputNumber
                      value={appSettings.database.connectionTimeout}
                      onChange={(value) => handleSettingChange('database', 'connectionTimeout', value)}
                      min={1000}
                      max={60000}
                      style={{ width: '100%', fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={24}>
                    <Space>
                      <Switch
                        checked={appSettings.database.enableLogging}
                        onChange={(checked) => handleSettingChange('database', 'enableLogging', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Enable Database Query Logging</span>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span style={{ fontSize: '12px' }}>
                  <SecurityScanOutlined /> Security
                </span>
              }
              key="2"
            >
              <Card size="small">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>JWT Token Expiration:</label>
                    <Select
                      value={appSettings.security.jwtExpiration}
                      onChange={(value) => handleSettingChange('security', 'jwtExpiration', value)}
                      style={{ width: '100%', fontSize: '12px' }}
                      size="small"
                    >
                      <Option value="1h">1 Hour</Option>
                      <Option value="24h">24 Hours</Option>
                      <Option value="7d">7 Days</Option>
                      <Option value="30d">30 Days</Option>
                    </Select>
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Password Min Length:</label>
                    <InputNumber
                      value={appSettings.security.passwordMinLength}
                      onChange={(value) => handleSettingChange('security', 'passwordMinLength', value)}
                      min={4}
                      max={20}
                      style={{ width: '100%', fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Max Login Attempts:</label>
                    <InputNumber
                      value={appSettings.security.maxLoginAttempts}
                      onChange={(value) => handleSettingChange('security', 'maxLoginAttempts', value)}
                      min={3}
                      max={10}
                      style={{ width: '100%', fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Session Timeout (seconds):</label>
                    <InputNumber
                      value={appSettings.security.sessionTimeout}
                      onChange={(value) => handleSettingChange('security', 'sessionTimeout', value)}
                      min={300}
                      max={86400}
                      style={{ width: '100%', fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.security.enableTwoFactor}
                        onChange={(checked) => handleSettingChange('security', 'enableTwoFactor', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Enable Two-Factor Authentication</span>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.security.requirePasswordChange}
                        onChange={(checked) => handleSettingChange('security', 'requirePasswordChange', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Require Periodic Password Change</span>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span style={{ fontSize: '12px' }}>
                  <FileProtectOutlined /> File Management
                </span>
              }
              key="3"
            >
              <Card size="small">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Max File Size (MB):</label>
                    <InputNumber
                      value={appSettings.fileManagement.maxFileSize}
                      onChange={(value) => handleSettingChange('fileManagement', 'maxFileSize', value)}
                      min={0}
                      placeholder="0 = Unlimited"
                      style={{ width: '100%', fontSize: '12px', height: '32px' }}
                    />
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                      0 means unlimited file size
                    </div>
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Default Password Strength:</label>
                    <Select
                      value={appSettings.fileManagement.defaultPasswordStrength}
                      onChange={(value) => handleSettingChange('fileManagement', 'defaultPasswordStrength', value)}
                      style={{ width: '100%', fontSize: '12px' }}
                      size="small"
                    >
                      <Option value="weak">Weak</Option>
                      <Option value="medium">Medium</Option>
                      <Option value="strong">Strong</Option>
                    </Select>
                  </Col>
                  <Col span={24}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Storage Location:</label>
                    <Input
                      value={appSettings.fileManagement.storageLocation}
                      onChange={(e) => handleSettingChange('fileManagement', 'storageLocation', e.target.value)}
                      placeholder="File storage directory path"
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.fileManagement.enablePasswordProtection}
                        onChange={(checked) => handleSettingChange('fileManagement', 'enablePasswordProtection', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Enable Password Protection</span>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.fileManagement.enableFileExpiration}
                        onChange={(checked) => handleSettingChange('fileManagement', 'enableFileExpiration', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Enable File Expiration</span>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span style={{ fontSize: '12px' }}>
                  <MailOutlined /> Email
                </span>
              }
              key="4"
            >
              <Card size="small">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>SMTP Host:</label>
                    <Input
                      value={appSettings.email.smtpHost}
                      onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                      placeholder="SMTP server hostname"
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>SMTP Port:</label>
                    <InputNumber
                      value={appSettings.email.smtpPort}
                      onChange={(value) => handleSettingChange('email', 'smtpPort', value)}
                      min={1}
                      max={65535}
                      style={{ width: '100%', fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>SMTP Username:</label>
                    <Input
                      value={appSettings.email.smtpUser}
                      onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                      placeholder="SMTP username"
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>SMTP Password:</label>
                    <Input.Password
                      value={appSettings.email.smtpPassword}
                      onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                      placeholder="SMTP password"
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={24}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>From Email Address:</label>
                    <Input
                      value={appSettings.email.fromEmail}
                      onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                      placeholder="noreply@example.com"
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.email.smtpSecure}
                        onChange={(checked) => handleSettingChange('email', 'smtpSecure', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Use SSL/TLS</span>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.email.enableEmailNotifications}
                        onChange={(checked) => handleSettingChange('email', 'enableEmailNotifications', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Enable Email Notifications</span>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span style={{ fontSize: '12px' }}>
                  <GlobalOutlined /> System
                </span>
              }
              key="5"
            >
              <Card size="small">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Application Name:</label>
                    <Input
                      value={appSettings.system.appName}
                      onChange={(e) => handleSettingChange('system', 'appName', e.target.value)}
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Application Version:</label>
                    <Input
                      value={appSettings.system.appVersion}
                      onChange={(e) => handleSettingChange('system', 'appVersion', e.target.value)}
                      style={{ fontSize: '12px', height: '32px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>Log Level:</label>
                    <Select
                      value={appSettings.system.logLevel}
                      onChange={(value) => handleSettingChange('system', 'logLevel', value)}
                      style={{ width: '100%', fontSize: '12px' }}
                      size="small"
                    >
                      <Option value="error">Error</Option>
                      <Option value="warn">Warning</Option>
                      <Option value="info">Info</Option>
                      <Option value="debug">Debug</Option>
                    </Select>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.system.maintenanceMode}
                        onChange={(checked) => handleSettingChange('system', 'maintenanceMode', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Maintenance Mode</span>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.system.enableRegistration}
                        onChange={(checked) => handleSettingChange('system', 'enableRegistration', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Enable User Registration</span>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Switch
                        checked={appSettings.system.enableGuestAccess}
                        onChange={(checked) => handleSettingChange('system', 'enableGuestAccess', checked)}
                        size="small"
                      />
                      <span style={{ fontSize: '12px' }}>Enable Guest Access</span>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </TabPane>
          </Tabs>
        </Spin>
      </div>
    </Sidebar>
  );
};

export default Settings;

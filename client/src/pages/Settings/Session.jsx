import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Form,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Spin,
  Alert,
  App
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import AuthContext from '../../context/AuthContext';
import { getSessionTimeout, setSessionTimeout, getActivityTimeout, setActivityTimeout } from '../../api/settingsService';
import { hasPermission } from '../../utils/permissions';

const { Title, Text } = Typography;

const Session = () => {
  const { user } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSessionTimeout, setCurrentSessionTimeout] = useState(480);
  const [currentActivityTimeout, setCurrentActivityTimeout] = useState(30);
  const { message } = App.useApp();

  // Check if user has permission to access settings
  const canAccessSettings = hasPermission(user, 'settings', 'read');
  const canUpdateSettings = hasPermission(user, 'settings', 'update');

  useEffect(() => {
    if (canAccessSettings) {
      fetchSessionSettings();
    }
  }, [canAccessSettings]);

  const fetchSessionSettings = async () => {
    try {
      setLoading(true);
      const [sessionResponse, activityResponse] = await Promise.all([
        getSessionTimeout(),
        getActivityTimeout()
      ]);

      const sessionTimeout = sessionResponse.data?.value || 480;
      const activityTimeout = activityResponse.data?.value || 30;

      setCurrentSessionTimeout(sessionTimeout);
      setCurrentActivityTimeout(activityTimeout);
      form.setFieldsValue({
        sessionTimeout: sessionTimeout,
        activityTimeout: activityTimeout
      });
    } catch (error) {
      console.error('Error fetching session settings:', error);
      message.error('Failed to load current settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      await Promise.all([
        setSessionTimeout(values.sessionTimeout),
        setActivityTimeout(values.activityTimeout)
      ]);

      setCurrentSessionTimeout(values.sessionTimeout);
      setCurrentActivityTimeout(values.activityTimeout);
      message.success('Session settings updated successfully');

      // Notify other components that settings have been updated
      window.dispatchEvent(new CustomEvent('settingsUpdated', {
        detail: {
          type: 'sessionSettings',
          sessionTimeout: values.sessionTimeout,
          activityTimeout: values.activityTimeout
        }
      }));
    } catch (error) {
      console.error('Error updating session settings:', error);
      message.error('Failed to update session settings');
    } finally {
      setSaving(false);
    }
  };

  if (!canAccessSettings) {
    return (
      <Sidebar>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access settings."
            type="error"
            showIcon
          />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={{
        padding: '16px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start'
        }}>
          <Link to="/settings">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              size={window.innerWidth < 768 ? "large" : "middle"}
              style={{
                color: '#1890ff',
                fontWeight: '500'
              }}
            >
              Back to Settings
            </Button>
          </Link>
        </div>

        <Title level={3} style={{
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <ClockCircleOutlined style={{ marginRight: '12px' }} />
          Session Settings
        </Title>

        <Row justify="center">
          <Col xs={24} sm={20} md={18} lg={16} xl={14}>
            <Card style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: window.innerWidth < 768 ? '16px' : '24px'
            }}>
              <Text type="secondary" style={{
                marginBottom: '24px',
                display: 'block',
                fontSize: window.innerWidth < 768 ? '14px' : '15px',
                textAlign: 'center'
              }}>
                Configure session expiration settings. These settings control when user sessions automatically expire due to inactivity or total session duration.
              </Text>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    sessionTimeout: currentSessionTimeout,
                    activityTimeout: currentActivityTimeout
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="sessionTimeout"
                        label="Session Timeout (minutes)"
                        rules={[
                          { required: true, message: 'Please enter session timeout' },
                          { type: 'number', min: 30, message: 'Must be at least 30 minutes' },
                          { type: 'number', max: 1440, message: 'Cannot exceed 24 hours (1440 minutes)' }
                        ]}
                        extra="Maximum total session duration"
                      >
                        <InputNumber
                          min={30}
                          max={1440}
                          style={{ width: '100%' }}
                          disabled={!canUpdateSettings}
                          placeholder="Enter timeout in minutes"
                          size={window.innerWidth < 768 ? "large" : "middle"}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="activityTimeout"
                        label="Activity Timeout (minutes)"
                        rules={[
                          { required: true, message: 'Please enter activity timeout' },
                          { type: 'number', min: 5, message: 'Must be at least 5 minutes' },
                          { type: 'number', max: 480, message: 'Cannot exceed 8 hours (480 minutes)' }
                        ]}
                        extra="Inactivity timeout before session expires"
                      >
                        <InputNumber
                          min={5}
                          max={480}
                          style={{ width: '100%' }}
                          disabled={!canUpdateSettings}
                          placeholder="Enter timeout in minutes"
                          size={window.innerWidth < 768 ? "large" : "middle"}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#fafafa',
                    borderRadius: '6px',
                    border: '1px solid #d9d9d9'
                  }}>
                    <Text strong style={{
                      display: 'block',
                      marginBottom: '12px',
                      fontSize: window.innerWidth < 768 ? '14px' : '15px'
                    }}>
                      Current Values:
                    </Text>
                    <Row gutter={[12, 12]} align="middle">
                      <Col xs={24} sm={12}>
                        <Text style={{
                          fontSize: window.innerWidth < 768 ? '13px' : '14px',
                          padding: '8px 12px',
                          background: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #d9d9d9',
                          display: 'block',
                          textAlign: 'center'
                        }}>
                          <strong>Session:</strong> {currentSessionTimeout} min ({Math.floor(currentSessionTimeout / 60)}h {currentSessionTimeout % 60}m)
                        </Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text style={{
                          fontSize: window.innerWidth < 768 ? '13px' : '14px',
                          padding: '8px 12px',
                          background: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #d9d9d9',
                          display: 'block',
                          textAlign: 'center'
                        }}>
                          <strong>Activity:</strong> {currentActivityTimeout} min
                        </Text>
                      </Col>
                    </Row>
                  </div>

                  <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    {canUpdateSettings ? (
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={saving}
                        icon={<SaveOutlined />}
                        size={window.innerWidth < 768 ? "large" : "middle"}
                        style={{
                          minWidth: window.innerWidth < 768 ? '200px' : '150px',
                          height: window.innerWidth < 768 ? '44px' : '36px'
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    ) : (
                      <Alert
                        message="Read-only Mode"
                        description="You can view but not modify settings."
                        type="warning"
                        showIcon
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                </Form>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Sidebar>
  );
};

export default Session;
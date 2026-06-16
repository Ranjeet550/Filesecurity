import { useState, useEffect, useContext } from 'react';
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
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import AuthContext from '../../context/AuthContext';
import { getDownloadLimit, setDownloadLimit } from '../../api/settingsService';
import { hasPermission } from '../../utils/permissions';

/**
 * Check if user is superadmin
 * @param {Object} user - User object with role
 * @returns {boolean} - True if user is superadmin
 */
const isSuperadmin = (user) => {
  return user?.role?.name === 'superadmin';
};

const { Title } = Typography;

const Configuration = () => {
  const { user } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentLimit, setCurrentLimit] = useState(1);
  const { message } = App.useApp();

  // Check if user has permission to access settings
  const canAccessSettings = hasPermission(user, 'settings', 'read');
  const canUpdateSettings = hasPermission(user, 'settings', 'update');

  useEffect(() => {
    if (canAccessSettings) {
      fetchDownloadLimit();
    }
  }, [canAccessSettings]);

  const fetchDownloadLimit = async () => {
    try {
      setLoading(true);
      const response = await getDownloadLimit();
      const limit = response.data?.value || 1;
      setCurrentLimit(limit);
      form.setFieldsValue({ downloadLimit: limit });
    } catch (error) {
      console.error('Error fetching download limit:', error);
      message.error('Failed to load current settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      await setDownloadLimit(values.downloadLimit);
      setCurrentLimit(values.downloadLimit);
      message.success('Download limit updated successfully');

      // Notify other components that settings have been updated
      window.dispatchEvent(new CustomEvent('settingsUpdated', {
        detail: { type: 'downloadLimit', value: values.downloadLimit }
      }));
    } catch (error) {
      console.error('Error updating download limit:', error);
      message.error('Failed to update download limit');
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
        <Title level={3} style={{
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <SettingOutlined style={{ marginRight: '12px' }} />
          Settings
        </Title>

        <Row gutter={[
          { xs: 12, sm: 16, md: 20, lg: 24 },
          { xs: 12, sm: 16, md: 20, lg: 24 }
        ]}>
          <Col xs={24} sm={12} md={8} lg={8} xl={6}>
            <Card style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: '4px'
            }}>
              

              {loading ? (
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <Spin size="small" />
                </div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{ downloadLimit: currentLimit }}
                >
                  <Form.Item
                    name="downloadLimit"
                    label="Download Limit"
                    rules={[
                      { required: true, message: 'Please enter a download limit' },
                      { type: 'number', min: 1, message: 'Must be at least 1' },
                      { type: 'number', max: 100, message: 'Cannot exceed 100' }
                    ]}
                    
                    style={{ marginBottom: '12px' }}
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      disabled={!canUpdateSettings}
                      placeholder="Enter limit"
                      size="middle"
                    />
                  </Form.Item>

                  

                  <div style={{ textAlign: 'center' }}>
                    {canUpdateSettings ? (
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={saving}
                        icon={<SaveOutlined />}
                        size="middle"
                        style={{
                          width: '80%'
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
                        style={{ marginTop: '8px' }}
                      />
                    )}
                  </div>
                </Form>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8} xl={6}>
            <Card style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: '16px'
            }}>
              <Title level={4} style={{
                margin: '0 0 8px 0'
              }}>
                <TeamOutlined style={{ marginRight: '6px' }} />
                Group Images
              </Title>
             

              <Link to="/group-images" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  size="middle"
                  style={{
                    borderRadius: '6px',
                    width: '100%'
                  }}
                >
                  Manage Group Images
                </Button>
              </Link>
            </Card>
          </Col>

          {isSuperadmin(user) && (
            <Col xs={24} sm={12} md={8} lg={8} xl={6}>
              <Card style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                padding: '16px'
              }}>
                <Title level={4} style={{
                  margin: '0 0 8px 0'
                }}>
                  <ClockCircleOutlined style={{ marginRight: '6px' }} />
                  Session Settings
                </Title>
                

                <Link to="/session-settings" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<ClockCircleOutlined />}
                    size="middle"
                    style={{
                      borderRadius: '6px',
                      width: '100%'
                    }}
                  >
                    Manage Sessions
                  </Button>
                </Link>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </Sidebar>
  );
};

export default Configuration;

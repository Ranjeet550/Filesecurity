import { useState, useContext } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Alert,
  App,
  Result
} from 'antd';
import { 
  LockOutlined, 
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_API_URL } from '../../config';
import Sidebar from '../../components/Sidebar';
import AuthContext from '../../context/AuthContext';

const { Title, Text } = Typography;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${AUTH_API_URL}/change-password`, 
        { 
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess(true);
      message.success('Password changed successfully');
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (success) {
    return (
      <Sidebar >
        <div className="fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <Card
            className="dashboard-card"
            style={{
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: '#00BF96', fontSize: '48px' }} />}
              title={<span style={{ fontSize: '18px' }}>Password Changed Successfully!</span>}
              subTitle={<span style={{ fontSize: '14px' }}>Your password has been changed. For security reasons, please log in again with your new password.</span>}
              extra={[
                <Button
                  type="primary"
                  key="logout"
                  onClick={handleLogout}
                  className="gradient-button"
                  size="middle"
                  style={{ fontSize: '14px' }}
                >
                  Log Out
                </Button>,
                <Button
                  key="dashboard"
                  onClick={handleBackToDashboard}
                  size="middle"
                  style={{ fontSize: '14px' }}
                >
                  Back to Dashboard
                </Button>
              ]}
            />
          </Card>
        </div>
      </Sidebar >
    );
  }

  return (
    <Sidebar >
      <div className="fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <Title level={4} style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Change Password</Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>Update your account password</Text>
        </div>

        <Card
          className="dashboard-card"
          style={{
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16, fontSize: '14px' }}
            />
          )}

          <Form
            form={form}
            name="changePassword"
            onFinish={handleSubmit}
            layout="vertical"
            size="middle"
          >
            <Form.Item
              name="currentPassword"
              label={<span style={{ fontSize: '14px' }}>Current Password</span>}
              rules={[
                { required: true, message: 'Please input your current password!' }
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#00BF96', fontSize: '14px' }} />}
                placeholder="Enter current password"
                style={{ fontSize: '14px' }}
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label={<span style={{ fontSize: '14px' }}>New Password</span>}
              rules={[
                { required: true, message: 'Please input your new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
              hasFeedback
              style={{ marginBottom: '16px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#00BF96', fontSize: '14px' }} />}
                placeholder="Enter new password"
                style={{ fontSize: '14px' }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={{ fontSize: '14px' }}>Confirm New Password</span>}
              dependencies={['newPassword']}
              hasFeedback
              rules={[
                { required: true, message: 'Please confirm your new password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
              style={{ marginBottom: '20px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#00BF96', fontSize: '14px' }} />}
                placeholder="Confirm new password"
                style={{ fontSize: '14px' }}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="gradient-button"
                size="middle"
                style={{ fontSize: '14px' }}
              >
                Change Password
              </Button>

              <Button
                onClick={handleBackToDashboard}
                icon={<ArrowLeftOutlined style={{ fontSize: '14px' }} />}
                size="middle"
                style={{ fontSize: '14px' }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </Sidebar >
  );
};

export default ChangePassword;

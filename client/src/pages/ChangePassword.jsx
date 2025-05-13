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
import { AUTH_API_URL } from '../config';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';

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
      <DashboardLayout>
        <div className="fade-in">
          <Card className="dashboard-card">
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: '#00BF96' }} />}
              title="Password Changed Successfully!"
              subTitle="Your password has been changed. For security reasons, please log in again with your new password."
              extra={[
                <Button 
                  type="primary" 
                  key="logout" 
                  onClick={handleLogout}
                  className="gradient-button"
                >
                  Log Out
                </Button>,
                <Button 
                  key="dashboard" 
                  onClick={handleBackToDashboard}
                >
                  Back to Dashboard
                </Button>
              ]}
            />
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: '24px' }}>
          <Title level={3} style={{ margin: '0 0 8px 0' }}>Change Password</Title>
          <Text type="secondary">Update your account password</Text>
        </div>
        
        <Card className="dashboard-card">
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 24 }}
            />
          )}
          
          <Form
            form={form}
            name="changePassword"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[
                { required: true, message: 'Please input your current password!' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#00BF96' }} />} 
                placeholder="Enter current password" 
              />
            </Form.Item>
            
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please input your new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
              hasFeedback
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#00BF96' }} />} 
                placeholder="Enter new password" 
              />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
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
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#00BF96' }} />} 
                placeholder="Confirm new password" 
              />
            </Form.Item>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="gradient-button"
              >
                Change Password
              </Button>
              
              <Button 
                onClick={handleBackToDashboard}
                icon={<ArrowLeftOutlined />}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;

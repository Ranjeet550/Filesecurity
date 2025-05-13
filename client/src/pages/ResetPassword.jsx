import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Divider,
  App,
  Result,
  Grid,
  Row,
  Col
} from 'antd';
import {
  LockOutlined,
  SecurityScanOutlined,
  CheckCircleOutlined,
  LoginOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AUTH_API_URL } from '../config';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ResetPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const screens = useBreakpoint();

  useEffect(() => {
    // Check if reset token exists
    const resetToken = localStorage.getItem('resetToken');
    if (!resetToken) {
      navigate('/forgot-password');
      return;
    }

    // Get email from location state
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location, navigate]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const resetToken = localStorage.getItem('resetToken');

      await axios.post(
        `${AUTH_API_URL}/reset-password`,
        { password: values.password },
        {
          headers: {
            Authorization: `Bearer ${resetToken}`
          }
        }
      );

      // Clear reset token
      localStorage.removeItem('resetToken');

      setSuccess(true);
      message.success('Password reset successful');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        animation: 'fadeIn 0.5s ease-in-out',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 }
        }
      }}>
        <Card style={{
          width: '100%',
          maxWidth: screens.xs ? '90%' : screens.sm ? '450px' : '420px',
          padding: screens.xs ? '16px' : '24px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease'
        }}>
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#00BF96' }} />}
            title="Password Reset Successful!"
            subTitle="Your password has been reset successfully. You can now log in with your new password."
            extra={[
              <Button
                type="primary"
                key="login"
                onClick={handleGoToLogin}
                icon={<LoginOutlined />}
                className="gradient-button"
                style={{
                  height: '36px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(0, 191, 150, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                Go to Login
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      animation: 'fadeIn 0.5s ease-in-out',
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 }
      }
    }}>
      <Card style={{
        width: '100%',
        maxWidth: screens.xs ? '90%' : screens.sm ? '450px' : '420px',
        padding: screens.xs ? '16px' : '24px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        transform: 'translateY(0)',
        transition: 'all 0.3s ease',
        ':hover': {
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-5px)'
        }
      }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px'
          }}>
            <SecurityScanOutlined style={{
              fontSize: '28px',
              color: '#00BF96',
              marginRight: '8px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 191, 150, 0.3))'
            }} />
            <SafetyOutlined style={{
              fontSize: '20px',
              color: '#00A080',
              position: 'relative',
              top: '2px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 160, 128, 0.3))'
            }} />
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #00BF96 0%, #00A080 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            Secure File Transfer
          </div>
        </div>

        <Title level={5} style={{
          textAlign: 'center',
          marginBottom: '15px',
          fontWeight: '600',
          color: '#333'
        }}>
          Reset Password
        </Title>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{
              marginBottom: 16,
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(255, 92, 117, 0.2)',
              fontSize: '12px',
              padding: '8px 12px'
            }}
          />
        )}

        <Form
          form={form}
          name="resetPassword"
          onFinish={handleSubmit}
          layout="vertical"
          size="middle"
        >
          <Text style={{ marginBottom: '16px', display: 'block' }}>
            Create a new password for your account {email && <strong>({email})</strong>}
          </Text>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: '500', fontSize: '13px' }}>New Password</span>}
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
            hasFeedback
            style={{ marginBottom: '12px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#00BF96' }} />}
              placeholder="Enter new password"
              style={{
                borderRadius: '6px',
                height: '36px',
                transition: 'all 0.3s ease'
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ fontWeight: '500', fontSize: '13px' }}>Confirm Password</span>}
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
            style={{ marginBottom: '16px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#00BF96' }} />}
              placeholder="Confirm new password"
              style={{
                borderRadius: '6px',
                height: '36px',
                transition: 'all 0.3s ease'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '10px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="gradient-button"
              style={{
                height: '36px',
                fontSize: '14px',
                borderRadius: '6px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0, 191, 150, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">
            <Button
              type="link"
              icon={<LoginOutlined />}
              style={{
                padding: '0',
                fontWeight: '500',
                color: '#00BF96',
                fontSize: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              Back to Login
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;

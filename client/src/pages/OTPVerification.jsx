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
  Grid,
  Row,
  Col
} from 'antd';
import {
  LockOutlined,
  SecurityScanOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AUTH_API_URL } from '../config';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const OTPVerification = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const screens = useBreakpoint();

  useEffect(() => {
    // Get email from location state
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email is provided, redirect to forgot password page
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${AUTH_API_URL}/verify-otp`, {
        email,
        otp: values.otp
      });

      // Store the reset token
      localStorage.setItem('resetToken', response.data.resetToken);

      message.success('OTP verified successfully');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      setError(null);

      await axios.post(`${AUTH_API_URL}/forgot-password`, { email });

      message.success('New OTP sent to your email');
      setCountdown(60); // Set 60 seconds countdown
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

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
        maxWidth: screens.xs ? '90%' : screens.sm ? '400px' : '380px',
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
          Verify OTP
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
          name="otpVerification"
          onFinish={handleSubmit}
          layout="vertical"
          size="middle"
        >
          <Text style={{ marginBottom: '16px', display: 'block' }}>
            Enter the One-Time Password (OTP) sent to <strong>{email}</strong>
          </Text>

          <Form.Item
            name="otp"
            rules={[
              { required: true, message: 'Please input the OTP!' },
              { len: 6, message: 'OTP must be 6 digits!' },
              { pattern: /^[0-9]+$/, message: 'OTP must contain only numbers!' }
            ]}
          >
            <Input
              prefix={<LockOutlined style={{ color: '#00BF96' }} />}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={{
                letterSpacing: '8px',
                textAlign: 'center',
                fontSize: '20px',
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
              Verify OTP
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Button
              type="link"
              onClick={handleResendOTP}
              disabled={countdown > 0 || resending}
              icon={<ReloadOutlined />}
              style={{
                color: '#00BF96',
                fontSize: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Button>
          </div>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Link to="/forgot-password">
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              style={{
                padding: '0',
                fontWeight: '500',
                color: '#00BF96',
                fontSize: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              Back to Forgot Password
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default OTPVerification;

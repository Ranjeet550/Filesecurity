import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Divider,
  App,
  Grid
} from 'antd';
import {
  MailOutlined,
  SecurityScanOutlined,
  ArrowLeftOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_API_URL } from '../config';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const screens = useBreakpoint();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      await axios.post(`${AUTH_API_URL}/forgot-password`, { email: values.email });

      setEmailSent(true);
      setEmail(values.email);
      message.success('OTP sent to your email');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToOTP = () => {
    navigate('/verify-otp', { state: { email } });
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
          {emailSent ? 'OTP Sent!' : 'Forgot Password'}
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

        {emailSent ? (
          <div style={{ textAlign: 'center' }}>
            <Alert
              message="OTP Sent Successfully"
              description={`We've sent a One-Time Password (OTP) to ${email}. Please check your email and enter the OTP on the next screen.`}
              type="success"
              showIcon
              style={{
                marginBottom: 24,
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 191, 150, 0.2)'
              }}
            />

            <Button
              type="primary"
              onClick={handleProceedToOTP}
              className="gradient-button"
              style={{
                height: '36px',
                fontSize: '14px',
                width: '100%',
                borderRadius: '6px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0, 191, 150, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Proceed to Verify OTP
            </Button>
          </div>
        ) : (
          <Form
            form={form}
            name="forgotPassword"
            onFinish={handleSubmit}
            layout="vertical"
            size="middle"
          >
            <Text style={{ marginBottom: '16px', display: 'block' }}>
              Enter your email address and we'll send you a One-Time Password (OTP) to reset your password.
            </Text>

            <Form.Item
              name="email"
              label={<span style={{ fontWeight: '500', fontSize: '13px' }}>Email</span>}
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#00BF96' }} />}
                placeholder="Enter your email"
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
                Send OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">
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
              Back to Login
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;

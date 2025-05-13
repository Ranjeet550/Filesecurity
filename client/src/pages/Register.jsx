import { useState, useContext } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin, Divider, Steps, Grid, Row, Col } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SecurityScanOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Register = () => {
  const [form] = Form.useForm();
  const { register, loading, error, setError } = useContext(AuthContext);
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const onFinish = async (values) => {
    try {
      setLocalLoading(true);
      await register({
        name: values.name,
        email: values.email,
        password: values.password
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setLocalLoading(false);
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
          Create your account
        </Title>

        {error && (
          <Alert
            message="Registration Failed"
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

        <Steps
          size="small"
          current={0}
          items={[
            {
              title: 'Account',
              icon: <SolutionOutlined />
            },
            {
              title: 'Verify',
              icon: <SafetyOutlined />
            },
            {
              title: 'Done',
              icon: <CheckCircleOutlined />
            }
          ]}
          style={{ marginBottom: '24px' }}
        />

        <Spin spinning={loading || localLoading}>
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="middle"
          >
            <Form.Item
              name="name"
              label={<span style={{ fontWeight: '500', fontSize: '13px' }}>Full Name</span>}
              rules={[{ required: true, message: 'Please input your name!' }]}
              style={{ marginBottom: '12px' }}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#00BF96' }} />}
                placeholder="Enter your full name"
                style={{
                  borderRadius: '6px',
                  height: '36px',
                  transition: 'all 0.3s ease'
                }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={{ fontWeight: '500', fontSize: '13px' }}>Email</span>}
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
              style={{ marginBottom: '12px' }}
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

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: '500', fontSize: '13px' }}>Password</span>}
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
              extra={<Text type="secondary" style={{ fontSize: '11px' }}>Password must be at least 6 characters</Text>}
              style={{ marginBottom: '12px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#00BF96' }} />}
                placeholder="Create a password"
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
                placeholder="Confirm your password"
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
                loading={loading || localLoading}
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
                Create Account
              </Button>
            </Form.Item>

            <Divider style={{ margin: '8px 0' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>OR</Text>
            </Divider>

            <Row justify="center" style={{ marginTop: '8px' }}>
              <Col>
                <Text style={{ fontSize: '12px' }}>Already have an account?</Text>
                {' '}
                <Link to="/login">
                  <Button
                    type="link"
                    style={{
                      padding: '0',
                      fontWeight: '500',
                      color: '#00BF96',
                      fontSize: '12px',
                      transition: 'all 0.3s ease'
                    }}
                    className="hover-scale"
                  >
                    Login now!
                  </Button>
                </Link>
              </Col>
            </Row>
          </Form>
        </Spin>

        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '10px', opacity: 0.8 }}>
            By registering, you agree to our Terms of Service and Privacy Policy
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;

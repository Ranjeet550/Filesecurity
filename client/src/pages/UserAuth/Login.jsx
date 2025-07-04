import { useState, useContext } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin, Divider, Row, Col, Grid } from 'antd';
import { UserOutlined, LockOutlined, SecurityScanOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Login = () => {
  const [form] = Form.useForm();
  const { login, loading, error, setError } = useContext(AuthContext);
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const onFinish = async (values) => {
    try {
      setLocalLoading(true);
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
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
      <Card
        style={{
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
        }}
      >
        <div className="auth-logo" style={{ animation: 'pulse 2s infinite ease-in-out', marginBottom: '12px' }}>
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
          Log in to your account
        </Title>

        {error && (
          <Alert
            message="Login Failed"
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

        <Spin spinning={loading || localLoading}>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="middle"
          >
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
                prefix={<UserOutlined style={{ color: '#00BF96' }} />}
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
              rules={[{ required: true, message: 'Please input your password!' }]}
              style={{ marginBottom: '16px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#00BF96' }} />}
                placeholder="Enter your password"
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
                Log in
              </Button>
            </Form.Item>

            <Row justify="center" style={{ marginBottom: '8px' }}>
              <Col>
                <Link to="/forgot-password">
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
                    Forgot password?
                  </Button>
                </Link>
              </Col>
            </Row>

            

            
          </Form>
        </Spin>

       
      </Card>
    </div>
  );
};

export default Login;

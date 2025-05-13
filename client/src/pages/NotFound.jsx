import { Result, Button, Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import {
  HomeOutlined,
  SearchOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const NotFound = () => {
  return (
    <div className="auth-container fade-in">
      <Card className="login-form" style={{ width: '500px' }}>
        <div className="auth-logo">
          <SecurityScanOutlined style={{ fontSize: '36px', marginBottom: '16px' }} />
          <div>Secure File Transfer</div>
        </div>

        <Result
          status="404"
          title="Page Not Found"
          subTitle="Sorry, the page you visited does not exist."
          icon={<SearchOutlined style={{ color: '#00BF96' }} />}
          extra={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Link to="/dashboard">
                <Button
                  type="primary"
                  icon={<HomeOutlined />}
                  size="large"
                  className="gradient-button"
                  style={{ minWidth: '200px' }}
                >
                  Back to Dashboard
                </Button>
              </Link>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Text type="secondary">
                  The page you're looking for might have been removed, had its name changed,
                  or is temporarily unavailable.
                </Text>
              </div>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default NotFound;

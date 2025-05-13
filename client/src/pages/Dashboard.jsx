import { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  App,
  Tabs,
  Empty,
  Tooltip
} from 'antd';
import {
  FileOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileZipOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getFiles, deleteFile, getFilePassword } from '../api/fileService';
import AuthContext from '../context/AuthContext';
import { STORAGE_LIMIT } from '../config';

const { Title, Text } = Typography;

// Helper function to get file icon based on mimetype
const getFileIcon = (mimetype) => {
  if (mimetype?.includes('zip') || mimetype?.includes('compressed')) {
    return <FileZipOutlined style={{ color: '#faad14' }} />;
  } else if (mimetype?.includes('pdf')) {
    return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  } else if (mimetype?.includes('image')) {
    return <FileImageOutlined style={{ color: '#1890ff' }} />;
  } else {
    return <FileTextOutlined style={{ color: '#52c41a' }} />;
  }
};

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalDownloads: 0,
    recentUploads: 0,
    storageUsed: 0,
    storageLimit: STORAGE_LIMIT
  });

  // Check if we should show all files view
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'all-files') {
      setActiveView('all-files');
    } else {
      setActiveView('dashboard');
    }
  }, [searchParams]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await getFiles();
      setFiles(response.data);

      // Calculate stats
      const totalFiles = response.data.length;
      const totalDownloads = response.data.reduce((acc, file) => acc + file.downloads.length, 0);
      const recentUploads = response.data.filter(
        file => new Date(file.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      const storageUsed = response.data.reduce((acc, file) => acc + file.size, 0);

      setStats({
        totalFiles,
        totalDownloads,
        recentUploads,
        storageUsed,
        storageLimit: STORAGE_LIMIT
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching files:', error);

      // Check if it's an authentication error
      if (error.message === 'Not authorized to access this route' ||
          error.message?.includes('authentication') ||
          error.message?.includes('token')) {
        message.error('Your session has expired. Please log in again.');
        // Log the user out and redirect to login
        logout();
        navigate('/login');
      } else {
        message.error('Failed to fetch files');
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteFile(id);
      message.success('File deleted successfully');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);

      // Check if it's an authentication error
      if (error.message === 'Not authorized to access this route' ||
          error.message?.includes('authentication') ||
          error.message?.includes('token')) {
        message.error('Your session has expired. Please log in again.');
        // Log the user out and redirect to login
        logout();
        navigate('/login');
      } else {
        message.error('Failed to delete file');
      }
    }
  };

  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.mimetype)}
          <span style={{ fontWeight: '500' }}>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatBytes(size),
      width: '12%',
    },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
      width: '15%',
    },
    {
      title: 'Downloads',
      dataIndex: 'downloads',
      key: 'downloads',
      render: (downloads) => (
        <Space>
          <DownloadOutlined style={{ color: '#1890ff' }} />
          {downloads.length}
        </Space>
      ),
      width: '12%',
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date) => {
        const now = new Date();
        const expiry = new Date(date);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        return (
          <Space>
            <Text
              type={daysLeft < 5 ? "warning" : "secondary"}
              style={{ fontWeight: daysLeft < 5 ? '500' : '400' }}
            >
              {daysLeft} days left
            </Text>
          </Space>
        );
      },
      width: '15%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Link to={`/download/${record.id || record._id}`}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="small"
              className="gradient-button"
            >
              Download
            </Button>
          </Link>
          <Button
            type="default"
            icon={<ShareAltOutlined />}
            size="small"
            onClick={async () => {
              try {
                // Get the file password
                const fileId = record.id || record._id;
                const response = await getFilePassword(fileId);
                if (response.success && response.data.password) {
                  // Create a link with the password included as a query parameter
                  // Use id instead of _id as that's what the server returns
                  const link = `${window.location.origin}/download/${fileId}?password=${encodeURIComponent(response.data.password)}`;
                  navigator.clipboard.writeText(link);
                  message.success('Link with password copied to clipboard');
                } else {
                  throw new Error('Failed to get file password');
                }
              } catch (error) {
                console.error('Error sharing file:', error);
                message.error('Failed to share file');
              }
            }}
          >
            Share
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this file?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
      width: '25%',
    },
  ];

  // Calculate storage usage percentage
  const storagePercentage = Math.round((stats.storageUsed / stats.storageLimit) * 100);

  return (
    <DashboardLayout>
      <div className="fade-in">
        {activeView === 'dashboard' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <Title level={3} style={{ margin: '0 0 8px 0', color: '#1a2141' }}>Welcome back, {user?.name}!</Title>
              <Text type="secondary">Here's an overview of your secure file transfers</Text>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '20px' }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1a2141 0%, #273053 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(26, 33, 65, 0.15)',
                    border: 'none',
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(26, 33, 65, 0.2)',
                    }
                  }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>Total Files</span>}
                    value={stats.totalFiles}
                    valueStyle={{ color: 'white', fontSize: '28px' }}
                    prefix={<FileOutlined style={{ marginRight: '8px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '20px' }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
                    border: 'none',
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(24, 144, 255, 0.2)',
                    }
                  }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>Downloads</span>}
                    value={stats.totalDownloads}
                    valueStyle={{ color: 'white', fontSize: '28px' }}
                    prefix={<DownloadOutlined style={{ marginRight: '8px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '20px' }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #FF9F43 0%, #FF7A01 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(255, 159, 67, 0.15)',
                    border: 'none',
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(255, 159, 67, 0.2)',
                    }
                  }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>Recent Uploads</span>}
                    value={stats.recentUploads}
                    valueStyle={{ color: 'white', fontSize: '28px' }}
                    prefix={<UploadOutlined style={{ marginRight: '8px' }} />}
                    suffix={<small style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>/7 days</small>}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '20px' }
                  }}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.03)',
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                    }
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                      Storage Used
                      <Tooltip title={`${formatBytes(stats.storageUsed)} of ${formatBytes(stats.storageLimit)} used`}>
                        <InfoCircleOutlined style={{ marginLeft: '8px', color: '#8c8c8c', fontSize: '12px' }} />
                      </Tooltip>
                    </Text>
                  </div>
                  <Progress
                    percent={storagePercentage}
                    status={storagePercentage > 90 ? "exception" : "normal"}
                    strokeColor={{
                      '0%': '#00BF96',
                      '100%': '#00A080',
                    }}
                    strokeWidth={8}
                    trailColor="#f0f0f0"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{formatBytes(stats.storageUsed)}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{formatBytes(stats.storageLimit)}</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}

        <Card
          styles={{
            header: {
              borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
              padding: '16px 20px'
            },
            body: {
              padding: '0'
            }
          }}
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.03)',
            overflow: 'hidden'
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {activeView === 'all-files' ? (
                <AppstoreOutlined style={{ marginRight: '8px', fontSize: '18px', color: '#00BF96' }} />
              ) : (
                <FileOutlined style={{ marginRight: '8px', fontSize: '18px', color: '#00BF96' }} />
              )}
              <span style={{ fontWeight: '600', color: '#1a2141' }}>
                {activeView === 'all-files' ? 'All Files' : 'Your Files'}
              </span>
            </div>
          }
          extra={
            <Link to="/upload">
              <Button
                type="primary"
                icon={<UploadOutlined />}
                style={{
                  background: 'linear-gradient(90deg, #00BF96 0%, #00A080 100%)',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0, 191, 150, 0.2)',
                  borderRadius: '8px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px'
                }}
              >
                Upload New File
              </Button>
            </Link>
          }
        >
          <Table
            style={{
              '& .ant-table-thead > tr > th': {
                background: 'rgba(0, 0, 0, 0.02)',
                fontWeight: '600',
                color: '#1a2141'
              },
              '& .ant-table-tbody > tr:hover > td': {
                background: 'rgba(0, 191, 150, 0.05)'
              }
            }}
            columns={columns}
            dataSource={files}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} files`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

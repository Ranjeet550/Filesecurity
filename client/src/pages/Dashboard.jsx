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
  Tooltip,
  Modal,
  Form,
  Input,
  Alert,
  Divider,
  Spin,
  Result
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
  InfoCircleOutlined,
  LockOutlined,
  SecurityScanOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getFiles, deleteFile, getFileById, downloadFile } from '../api/fileService';
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

  // Download modal state
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadForm] = Form.useForm();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
      const totalDownloads = response.data.reduce((acc, file) => {
        const downloadCount = file.downloads && Array.isArray(file.downloads) ? file.downloads.length : 0;
        return acc + downloadCount;
      }, 0);
      const recentUploads = response.data.filter(
        file => new Date(file.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      const storageUsed = response.data.reduce((acc, file) => acc + (file.size || 0), 0);

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

  // Handle opening download modal
  const handleDownloadClick = async (record) => {
    try {
      setDownloadLoading(true);
      setDownloadError(null);
      setDownloadSuccess(false);
      setDownloadProgress(0);

      // Fetch file details
      const response = await getFileById(record.id || record._id);
      setSelectedFile(response.data);
      setDownloadModalVisible(true);
    } catch (error) {
      console.error('Error fetching file details:', error);
      message.error('Failed to load file details');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Handle download in modal
  const handleModalDownload = async (values) => {
    try {
      setDownloading(true);
      setDownloadError(null);

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 99) {
            clearInterval(progressInterval);
            return 99;
          }
          return prev + Math.floor(Math.random() * 10);
        });
      }, 300);

      // Perform the download
      const result = await downloadFile(selectedFile.id || selectedFile._id, values.password);
      console.log('Download completed successfully:', result);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Show success state
      setTimeout(() => {
        setDownloadSuccess(true);
        // Refresh the files list to update download counts
        fetchFiles();
      }, 500);

    } catch (error) {
      console.error('Download error:', error);
      setDownloadError('Invalid password or file not available');
      setDownloadProgress(0);
    } finally {
      setDownloading(false);
    }
  };

  // Close download modal
  const closeDownloadModal = () => {
    setDownloadModalVisible(false);
    setSelectedFile(null);
    setDownloadError(null);
    setDownloadSuccess(false);
    setDownloadProgress(0);
    downloadForm.resetFields();
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
      render: (downloads) => {
        const downloadCount = downloads && Array.isArray(downloads) ? downloads.length : 0;
        return (
          <Space>
            <DownloadOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: '500' }}>{downloadCount}</span>
          </Space>
        );
      },
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
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="small"
            className="gradient-button"
            onClick={() => handleDownloadClick(record)}
            loading={downloadLoading && selectedFile?.id === (record.id || record._id)}
          >
            Download
          </Button>
          <Button
            type="default"
            icon={<ShareAltOutlined />}
            size="small"
            onClick={async () => {
              try {
                const fileId = record.id || record._id;
                // Create a link without the password for security
                const link = `${window.location.origin}/download/${fileId}`;
                navigator.clipboard.writeText(link);
                message.success('Download link copied to clipboard');
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

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: '#666666', fontSize: '14px', fontWeight: '500' }}>Total Files</span>}
                    value={stats.totalFiles}
                    valueStyle={{ color: '#1a1a1a', fontSize: '32px', fontWeight: '600' }}
                    prefix={<FileOutlined style={{ color: '#1890ff', fontSize: '20px', marginRight: '8px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: '#666666', fontSize: '14px', fontWeight: '500' }}>Downloads</span>}
                    value={stats.totalDownloads}
                    valueStyle={{ color: '#1a1a1a', fontSize: '32px', fontWeight: '600' }}
                    prefix={<DownloadOutlined style={{ color: '#52c41a', fontSize: '20px', marginRight: '8px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: '#666666', fontSize: '14px', fontWeight: '500' }}>Recent Uploads</span>}
                    value={stats.recentUploads}
                    valueStyle={{ color: '#1a1a1a', fontSize: '32px', fontWeight: '600' }}
                    prefix={<UploadOutlined style={{ color: '#fa8c16', fontSize: '20px', marginRight: '8px' }} />}
                    suffix={<small style={{ fontSize: '12px', color: '#999999', fontWeight: '400' }}>/7 days</small>}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '14px', fontWeight: '500', color: '#666666', display: 'flex', alignItems: 'center' }}>
                      Storage Used
                      <Tooltip title={`${formatBytes(stats.storageUsed)} of ${formatBytes(stats.storageLimit)} used`}>
                        <InfoCircleOutlined style={{ marginLeft: '8px', color: '#999999', fontSize: '12px' }} />
                      </Tooltip>
                    </Text>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text style={{ fontSize: '32px', fontWeight: '600', color: '#1a1a1a' }}>
                      {storagePercentage}%
                    </Text>
                  </div>
                  <Progress
                    percent={storagePercentage}
                    status={storagePercentage > 90 ? "exception" : "normal"}
                    strokeColor={storagePercentage > 90 ? '#ff4d4f' : '#1890ff'}
                    strokeWidth={6}
                    trailColor="#f5f5f5"
                    showInfo={false}
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
              borderBottom: '1px solid #f0f0f0',
              padding: '20px 24px'
            },
            body: {
              padding: '0'
            }
          }}
          style={{
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f0f0f0',
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

        {/* Download Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <SecurityScanOutlined style={{ marginRight: '8px', color: '#00BF96' }} />
              Secure File Download
            </div>
          }
          open={downloadModalVisible}
          onCancel={closeDownloadModal}
          footer={null}
          width={600}
        >
          {downloadLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>Loading file information...</div>
            </div>
          ) : selectedFile ? (
            <>
              {downloadSuccess ? (
                <Result
                  status="success"
                  title="File Downloaded Successfully!"
                  subTitle="Your file has been downloaded securely."
                  icon={<CheckCircleOutlined style={{ color: '#00BF96' }} />}
                  extra={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Button
                          type="primary"
                          className="gradient-button"
                          onClick={closeDownloadModal}
                        >
                          Close
                        </Button>
                        <Button
                          onClick={() => {
                            setDownloadSuccess(false);
                            setDownloadProgress(0);
                          }}
                          icon={<DownloadOutlined />}
                        >
                          Download Again
                        </Button>
                      </Space>
                      <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Text type="secondary">
                          Check your downloads folder for the file. The file will open in your browser for viewing only.
                        </Text>
                      </div>
                    </Space>
                  }
                />
              ) : (
                <>
                  <Card
                    style={{
                      marginBottom: 24,
                      borderRadius: '8px',
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          background: '#f0f7ff',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '16px'
                        }}>
                          {getFileIcon(selectedFile.mimetype)}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 18, display: 'block' }}>
                            {selectedFile.filename || selectedFile.originalName}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            Size: {formatBytes(selectedFile.size)}
                          </Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 14 }}>
                              Uploaded by: {selectedFile.uploadedBy?.name || 'Anonymous'}
                            </Text>
                          </div>
                        </div>
                      </div>

                      <Divider style={{ margin: '16px 0' }} />

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#fff7e6',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #ffe7ba'
                      }}>
                        <FileProtectOutlined style={{ color: '#fa8c16', fontSize: '18px', marginRight: '12px' }} />
                        <div>
                          <Text strong style={{ color: '#d46b08' }}>Password Protected File</Text>
                          <div>
                            <Text type="warning">
                              You need the correct password to download this file. The downloaded file will open in your browser for secure viewing only.
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Space>
                  </Card>

                  {downloadError && (
                    <Alert
                      message="Download Error"
                      description={downloadError}
                      type="error"
                      showIcon
                      closable
                      onClose={() => setDownloadError(null)}
                      style={{ marginBottom: 24 }}
                    />
                  )}

                  <Form
                    form={downloadForm}
                    name="download"
                    onFinish={handleModalDownload}
                    layout="vertical"
                    size="large"
                  >
                    <Form.Item
                      name="password"
                      label="File Password"
                      rules={[{ required: true, message: 'Please enter the file password!' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#00BF96' }} />}
                        placeholder="Enter the password provided by the sender"
                        autoComplete="off"
                      />
                    </Form.Item>

                    {downloading && (
                      <div style={{ marginBottom: '20px' }}>
                        <Progress
                          percent={downloadProgress}
                          status={downloadProgress >= 100 ? "success" : "active"}
                          strokeColor={{
                            '0%': '#00BF96',
                            '100%': '#00A080',
                          }}
                        />
                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: '8px' }}>
                          {downloadProgress < 100 ? 'Downloading file...' : 'Download complete!'}
                        </Text>
                      </div>
                    )}

                    <Form.Item>
                      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={closeDownloadModal}>
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<DownloadOutlined />}
                          loading={downloading}
                          className="gradient-button"
                        >
                          Download File
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </>
              )}
            </>
          ) : (
            <Result
              status="error"
              title="File Not Found"
              subTitle="The file you are looking for does not exist or has expired."
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

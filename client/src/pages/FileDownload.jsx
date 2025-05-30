import { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Alert,
  Space,
  Spin,
  Result,
  Divider,
  Progress
} from 'antd';
import {
  LockOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  SecurityScanOutlined,
  FileProtectOutlined,
  FileZipOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { getFileById, downloadFile } from '../api/fileService';

const { Title, Text } = Typography;

// Helper function to get file icon based on mimetype
const getFileIcon = (mimetype) => {
  if (mimetype?.includes('zip') || mimetype?.includes('compressed')) {
    return <FileZipOutlined style={{ color: '#faad14', fontSize: 36 }} />;
  } else if (mimetype?.includes('pdf')) {
    return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 36 }} />;
  } else if (mimetype?.includes('image')) {
    return <FileImageOutlined style={{ color: '#1890ff', fontSize: 36 }} />;
  } else {
    return <FileTextOutlined style={{ color: '#52c41a', fontSize: 36 }} />;
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

const FileDownload = () => {
  const { fileId } = useParams();
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        const response = await getFileById(fileId);
        setFile(response.data);
      } catch (error) {
        console.error('Error fetching file:', error);
        setError('File not found or has expired');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId]);

  const handleDownload = async (values, event) => {
    // If an event was passed, prevent default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      setDownloading(true);
      setError(null);

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

      // Use a try-catch to handle the download
      const result = await downloadFile(fileId, values.password);
      console.log('Download completed successfully:', result);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Stay on the same page and show success message
      setTimeout(() => {
        setSuccess(true);
      }, 500);

      // Return false to prevent form submission
      return false;
    } catch (error) {
      console.error('Download error:', error);
      setError('Invalid password or file not available');
      setDownloadProgress(0);
      return false;
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container fade-in">
        <Card className="login-form" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading file information...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (!file && !loading) {
    return (
      <div className="auth-container fade-in">
        <Card className="login-form" style={{ width: '500px' }}>
          <Result
            status="error"
            title="File Not Found"
            subTitle="The file you are looking for does not exist or has expired."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            extra={
              <Space direction="vertical" style={{ width: '100%' }}>
                <Link to="/login">
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    className="gradient-button"
                    size="large"
                  >
                    Go to Login
                  </Button>
                </Link>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Text type="secondary">
                    The file may have been deleted or the link has expired.
                  </Text>
                </div>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container fade-in">
        <Card className="login-form" style={{ width: '500px' }}>
          <Result
            status="success"
            title="File Downloaded Successfully!"
            subTitle="Your file has been downloaded securely."
            icon={<CheckCircleOutlined style={{ color: '#00BF96' }} />}
            extra={
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Link to="/login">
                    <Button
                      type="primary"
                      icon={<LoginOutlined />}
                      className="gradient-button"
                    >
                      Go to Login
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setSuccess(false);
                      setDownloadProgress(0);
                    }}
                    icon={<DownloadOutlined />}
                  >
                    Download Again
                  </Button>
                </Space>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Text type="secondary">
                    Check your downloads folder for the file. Remember that you'll need the same password to open the downloaded file.
                  </Text>
                </div>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container fade-in">
      <Card className="login-form" style={{ width: '500px' }}>
        <div className="auth-logo">
          <SecurityScanOutlined style={{ fontSize: '36px', marginBottom: '16px' }} />
          <div>Secure File Transfer</div>
        </div>

        <Title level={4} style={{ textAlign: 'center', marginBottom: '24px' }}>
          Secure File Download
        </Title>

        <Card
          style={{
            marginBottom: 24,
            borderRadius: '12px',
            background: '#f9f9f9'
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
                {getFileIcon(file.mimetype)}
              </div>
              <div>
                <Text strong style={{ fontSize: 18, display: 'block' }}>{file.filename}</Text>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Size: {formatBytes(file.size)}
                </Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    Uploaded by: {file.uploadedBy?.name || 'Anonymous'}
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

        {error && (
          <Alert
            message="Download Error"
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
          name="download"
          onFinish={(values, e) => {
            // Prevent default form submission behavior
            if (e && e.preventDefault) {
              e.preventDefault();
              e.stopPropagation();
            }
            handleDownload(values, e);
            return false; // Prevent form submission
          }}
          onSubmit={(e) => {
            // Extra safety to prevent form submission
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
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
            <Button
              type="primary"
              onClick={(e) => {
                e.preventDefault(); // Prevent any default behavior
                e.stopPropagation(); // Stop event propagation
                form.validateFields().then(values => {
                  handleDownload(values, e);
                }).catch(err => {
                  console.error('Validation failed:', err);
                });
                return false; // Prevent default behavior
              }}
              icon={<DownloadOutlined />}
              block
              loading={downloading}
              className="gradient-button"
              style={{ height: '45px', fontSize: '16px' }}
            >
              Download File
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">OR</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">
            <Button type="link" icon={<LoginOutlined />} style={{ padding: '0', fontWeight: '500', color: '#00BF96' }}>
              Login to your account
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default FileDownload;

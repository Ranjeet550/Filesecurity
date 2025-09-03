import { acceptFile } from '../../api/fileService';
import React, { useState, useEffect } from 'react';
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
  Progress,
  Grid
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
import { getFileById, downloadFile } from '../../api/fileService';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        const response = await getFileById(fileId);
        setFile(response.data);
      } catch (error) {
        console.error('Error fetching file:', error);
        setError('File not found');
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <Card style={{
          width: '100%',
          maxWidth: screens.xs ? '90%' : screens.sm ? '380px' : '360px',
          padding: screens.xs ? '16px' : '20px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#666' }}>Loading file information...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (!file && !loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <Card style={{
          width: '100%',
          maxWidth: screens.xs ? '90%' : screens.sm ? '400px' : '380px',
          padding: screens.xs ? '16px' : '20px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)'
        }}>
          <Result
            status="error"
            title="File Not Found"
            subTitle="The file you are looking for does not exist."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            extra={
              <Space direction="vertical" style={{ width: '100%' }}>
                <Link to="/login">
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    className="gradient-button"
                    size="small"
                    style={{ height: '36px', fontSize: '14px' }}
                  >
                    Go to Login
                  </Button>
                </Link>
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    The file may have been deleted or the link is invalid.
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <Card style={{
          width: '100%',
          maxWidth: screens.xs ? '90%' : screens.sm ? '420px' : '400px',
          padding: screens.xs ? '16px' : '20px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)'
        }}>
          <Result
            status="success"
            title="File Downloaded Successfully!"
           
            icon={<CheckCircleOutlined style={{ color: '#00BF96' }} />}
            extra={
              <Space direction="vertical" style={{ width: '100%' }}>
                
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
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
  <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      animation: 'fadeIn 0.5s ease-in-out'
    }}>
      <Card style={{
        width: '100%',
        maxWidth: screens.xs ? '90%' : screens.sm ? '420px' : '400px',
        padding: screens.xs ? '16px' : '20px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        transform: 'translateY(0)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <SecurityScanOutlined style={{
            fontSize: '28px',
            color: '#00BF96',
            marginRight: '8px',
            filter: 'drop-shadow(0 4px 6px rgba(0, 191, 150, 0.3))'
          }} />
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #00BF96 0%, #00A080 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Secure File Transfer
          </div>
        </div>

        <Title level={5} style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>
          Secure File Download
        </Title>

        {/* Accept button for assigned users if not already accepted */}
        {file && file.status !== 'Accepted' && (
          <Button
            type="primary"
            onClick={handleAccept}
            loading={accepting}
            style={{ marginBottom: 16, width: '100%' }}
            icon={<CheckCircleOutlined />}
          >
            Accept File
          </Button>
        )}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: '12px',
            background: '#f9f9f9',
            border: '1px solid #e8e8e8'
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#f0f7ff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                {React.cloneElement(getFileIcon(file.mimetype), { style: { fontSize: 24 } })}
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 15, display: 'block', lineHeight: '1.3' }}>{file.filename}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Size: {formatBytes(file.size)}
                </Text>
                
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#fff7e6',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #ffe7ba'
            }}>
              <FileProtectOutlined style={{ color: '#fa8c16', fontSize: '16px', marginRight: '10px' }} />
              <div>
                <Text strong style={{ color: '#d46b08', fontSize: '13px' }}>Password Protected File</Text>
                <div>
                  <Text type="warning" style={{ fontSize: '12px' }}>
                    You need the correct password to download this file. The downloaded file will remain password-protected.
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
            style={{ marginBottom: 16, fontSize: '13px' }}
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
          size="middle"
        >
          <Form.Item
            name="password"
            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>File Password</span>}
            rules={[{ required: true, message: 'Please enter the file password!' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#00BF96' }} />}
              placeholder="Enter the password provided by the sender"
              autoComplete="off"
              style={{ height: '38px',width: '80%' }}
            />
          </Form.Item>

          {downloading && (
            <div style={{ marginBottom: '16px' }}>
              <Progress
                percent={downloadProgress}
                status={downloadProgress >= 100 ? "success" : "active"}
                strokeColor={{
                  '0%': '#00BF96',
                  '100%': '#00A080',
                }}
                size="small"
              />
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: '6px', fontSize: '12px' }}>
                {downloadProgress < 100 ? 'Downloading file...' : 'Download complete!'}
              </Text>
            </div>
          )}

          <Form.Item style={{ marginBottom: '16px' }}>
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
              style={{ height: '38px', width: '70%', fontSize: '14px', borderRadius: '8px' }}
            >
              Download File
            </Button>
          </Form.Item>
        </Form>

        

        
      </Card>
    </div>
  );
};

export default FileDownload;

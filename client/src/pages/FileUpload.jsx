import { useState, useEffect } from 'react';
import {
  Typography,
  Upload,
  Button,
  Card,
  Alert,
  Space,
  Result,
  Input,
  Divider,
  Tooltip,
  Modal,
  Steps,
  Progress,
  App
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  CopyOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ShareAltOutlined,
  LockOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { uploadFile } from '../api/fileService';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileUpload = () => {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Add window resize listener for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    const file = fileList[0].originFileObj;

    // Log file details for debugging
    console.log('File to upload:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    try {
      setUploading(true);
      setError(null);
      setCurrentStep(1);

      const response = await uploadFile(file);
      console.log('Upload response:', response);

      if (response && response.data) {
        setUploadedFile(response.data);
        setFileList([]);
        setCurrentStep(2);
        message.success('File uploaded successfully');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Upload error:', error);

      // Handle different types of errors
      let errorMessage = 'Failed to upload file';

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          errorMessage = 'Unknown error occurred';
        }
      }

      setError(errorMessage);
      message.error(errorMessage);
      setCurrentStep(0);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyPassword = () => {
    if (uploadedFile?.password) {
      navigator.clipboard.writeText(uploadedFile.password);
      message.success('Password copied to clipboard');
    }
  };

  const handleCopyLink = () => {
    // Create a link with the password included as a query parameter
    // Use id instead of _id as that's what the server returns
    const fileId = uploadedFile.id || uploadedFile._id;
    const link = `${window.location.origin}/download/${fileId}?password=${encodeURIComponent(uploadedFile.password)}`;
    navigator.clipboard.writeText(link);
    message.success('Link with password copied to clipboard');
  };

  const props = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        message.error('File size must be less than 100MB');
        return Upload.LIST_IGNORE;
      }

      // Log file details for debugging
      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });

      setFileList([
        {
          uid: '-1',
          name: file.name,
          status: 'ready',
          size: file.size,
          type: file.type,
          originFileObj: file
        }
      ]);

      // Return false to prevent automatic upload
      return false;
    },
    fileList,
    multiple: false,
  };

  const showSecurityInfo = () => {
    Modal.info({
      title: 'File Security Information',
      icon: <SafetyOutlined style={{ color: '#00BF96' }} />,
      content: (
        <div>
          <p>When you upload a file, our system:</p>
          <ol>
            <li>Generates a unique password for the file</li>
            <li>Stores the file securely on our servers</li>
            <li>Records your location for security purposes</li>
            <li>Sets an expiration date (30 days by default)</li>
          </ol>
          <p>To share the file:</p>
          <ol>
            <li>Send the download link to the recipient</li>
            <li>The password is automatically included in the link for convenience</li>
            <li>The recipient can simply click the link to download the file</li>
          </ol>
          <p><strong>Enhanced Security:</strong> The downloaded file is password-protected and requires the same password to open after download.</p>
          <p>For maximum security, you can still share the password separately and send a link without the password.</p>
        </div>
      ),
      width: 550,
      okText: 'Got it',
      okButtonProps: {
        className: 'gradient-button',
        style: { borderColor: 'transparent' }
      }
    });
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

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: '24px' }}>
          <Title level={3} style={{ margin: '0 0 8px 0' }}>Upload File</Title>
          <Text type="secondary">Upload and securely share files with password protection</Text>
        </div>

        {error && (
          <Alert
            message="Upload Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Card className="dashboard-card">
          <Steps
            current={currentStep}
            items={[
              {
                title: 'Select File',
                icon: <FileAddOutlined />,
              },
              {
                title: 'Processing',
                icon: <SafetyOutlined />,
              },
              {
                title: 'Complete',
                icon: <CheckCircleOutlined />,
              },
            ]}
            style={{ marginBottom: '32px' }}
          />

          {uploadedFile ? (
            <Result
              status="success"
              title="File Uploaded Successfully!"
              subTitle="Your file has been securely uploaded with password protection."
              icon={<FileProtectOutlined style={{ color: '#00BF96' }} />}
              extra={[
                <Card
                  key="info"
                  style={{
                    marginBottom: 24,
                    textAlign: 'left',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: windowWidth < 576 ? 'column' : 'row',
                      justifyContent: 'space-between',
                      alignItems: windowWidth < 576 ? 'flex-start' : 'center'
                    }}>
                      <Title level={4} style={{ margin: 0 }}>File Details</Title>
                      <Text type="secondary" style={{ marginTop: windowWidth < 576 ? '8px' : 0 }}>
                        {formatBytes(uploadedFile.size || 0)}
                      </Text>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{
                      display: 'flex',
                      flexDirection: windowWidth < 400 ? 'column' : 'row',
                      alignItems: windowWidth < 400 ? 'flex-start' : 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#f0f7ff',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px',
                        marginBottom: windowWidth < 400 ? '12px' : 0
                      }}>
                        <FileProtectOutlined style={{ fontSize: '24px', color: '#00BF96' }} />
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '500',
                          fontSize: '16px',
                          wordBreak: 'break-word'
                        }}>{uploadedFile.filename}</div>
                        <Text type="secondary">Uploaded {new Date(uploadedFile.uploadedAt).toLocaleString()}</Text>
                      </div>
                    </div>

                    <div style={{
                      background: '#f9f9f9',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <Text strong>Share Link:</Text>
                        <div style={{
                          display: 'flex',
                          marginTop: '8px',
                          width: '100%',
                          overflowX: 'hidden'
                        }}>
                          <Input
                            value={`${window.location.origin}/download/${uploadedFile.id || uploadedFile._id}?password=${encodeURIComponent(uploadedFile.password)}`}
                            readOnly
                            style={{ width: '100%', wordBreak: 'break-all' }}
                            addonAfter={
                              <Tooltip title="Copy Link with Password">
                                <CopyOutlined
                                  onClick={handleCopyLink}
                                  style={{ cursor: 'pointer' }}
                                />
                              </Tooltip>
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Text strong>Password:</Text>
                        <div style={{
                          display: 'flex',
                          marginTop: '8px',
                          width: '100%'
                        }}>
                          <Input.Password
                            value={uploadedFile.password}
                            readOnly
                            style={{ width: '100%' }}
                            addonAfter={
                              <Tooltip title="Copy Password">
                                <CopyOutlined
                                  onClick={handleCopyPassword}
                                  style={{ cursor: 'pointer' }}
                                />
                              </Tooltip>
                            }
                            prefix={<LockOutlined style={{ color: '#ff4d4f' }} />}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: windowWidth < 500 ? 'column' : 'row',
                      alignItems: windowWidth < 500 ? 'flex-start' : 'center',
                      background: '#fff7e6',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #ffe7ba'
                    }}>
                      <ExclamationCircleOutlined style={{
                        color: '#fa8c16',
                        fontSize: '18px',
                        marginRight: windowWidth < 500 ? 0 : '12px',
                        marginBottom: windowWidth < 500 ? '8px' : 0
                      }} />
                      <div>
                        <Text strong style={{ color: '#d46b08' }}>Important Security Note</Text>
                        <div>
                          <Text type="warning">
                            The password is included in the link for convenience. The downloaded file is also password-protected and requires the same password to open.
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">
                        File expires on: {new Date(uploadedFile.expiresAt).toLocaleString()}
                      </Text>
                    </div>
                  </Space>
                </Card>,
                <div key="buttons" style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    className="gradient-button"
                    style={{ marginBottom: '8px' }}
                  >
                    <Link to="/dashboard">
                      Back to Dashboard
                    </Link>
                  </Button>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={handleCopyLink}
                    style={{ marginBottom: '8px' }}
                  >
                    Share File
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => {
                      setUploadedFile(null);
                      setCurrentStep(0);
                    }}
                    style={{ marginBottom: '8px' }}
                  >
                    Upload Another
                  </Button>
                </div>
              ]}
            />
          ) : (
            <div>
              <div className="upload-container">
                <Dragger {...props} style={{ padding: '32px 0' }}>
                  <div style={{ padding: '24px' }}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#00BF96', fontSize: '48px' }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: '18px', fontWeight: '500', marginTop: '16px' }}>
                      Click or drag file to this area to upload
                    </p>
                    <p className="ant-upload-hint" style={{ color: '#8c8c8c', maxWidth: '500px', margin: '8px auto 0' }}>
                      Support for a single file upload. Your file will be encrypted and password-protected.
                      File size limit: 100MB.
                    </p>
                  </div>
                </Dragger>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Space size="middle">
                    <Button
                      type="primary"
                      onClick={handleUpload}
                      disabled={fileList.length === 0}
                      loading={uploading}
                      icon={<UploadOutlined />}
                      className="gradient-button"
                      size="large"
                    >
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                    <Button
                      onClick={showSecurityInfo}
                      icon={<SafetyOutlined />}
                      size="large"
                    >
                      Security Information
                    </Button>
                  </Space>
                </div>
              </div>

              {uploading && (
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <Progress
                    percent={99}
                    status="active"
                    strokeColor={{
                      '0%': '#00BF96',
                      '100%': '#00A080',
                    }}
                  />
                  <Text type="secondary">Encrypting and uploading your file...</Text>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FileUpload;

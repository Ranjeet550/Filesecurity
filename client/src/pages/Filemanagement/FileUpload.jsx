import { useState, useEffect, useContext } from 'react';
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
  Steps,
  Progress,
  App,
  Row,
  Col,
  Badge,
  Statistic,
  DatePicker,
  Select
} from 'antd';
import dayjs from 'dayjs';
import {
  UploadOutlined,
  CopyOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ShareAltOutlined,
  LockOutlined,
  FileProtectOutlined,
  CloudUploadOutlined,
  SecurityScanOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { uploadFile } from '../../api/fileService';
import { encryptFile } from '../../utils/fileEncryption';
import AuthContext from '../../context/AuthContext';
import { getUsers } from '../../api/userService';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileUpload = () => {
  const { message } = App.useApp();
  const { user } = useContext(AuthContext);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);

  // Additional file details for admin
  const [QPdetails, setQPdetails] = useState('');
  const [Subcourse, setSubcourse] = useState('');
  const [subject, setSubject] = useState('');
  const [session, setSession] = useState('');
  const [semyear, setSemyear] = useState('');
  const [group, setGroup] = useState(user?.group || '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Function to generate a 10-character alphanumeric password with special characters
  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the remaining 6 characters with random selection from all categories
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 0; i < 6; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to make it more random
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setGeneratedPassword(password);
    message.success('New password generated successfully!');
  };

  // Generate password on component mount and fetch available groups
  useEffect(() => {
    generatePassword();
    fetchAvailableGroups();
  }, []);

  const fetchAvailableGroups = async () => {
    try {
      const response = await getUsers();
      if (response.data) {
        // Get unique groups from users
        const uniqueGroups = [...new Set(response.data.map(user => user.group).filter(group => group))];
        setAvailableGroups(uniqueGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    const currentPassword = useCustomPassword ? customPassword : generatedPassword;
    
    if (!currentPassword || currentPassword.length < 8) {
      message.error('Please enter a password with at least 8 characters for file encryption');
      return;
    }

    const file = fileList[0].originFileObj;

    try {
      setUploading(true);
      setError(null);
      setCurrentStep(1);

      // Check if file is PDF or Excel - don't encrypt these as server will protect them
      const isPDF = file.type === 'application/pdf';
      const isxlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel';

      let fileToUpload;
      if (isPDF || isxlsx) {
        // For PDF/Excel, upload original file - server will apply password protection
        fileToUpload = file;
      } else {
        // For other files, encrypt on client side
        fileToUpload = await encryptFile(file, currentPassword);
      }

      // Create a custom file object with password
      const fileWithPassword = new File([fileToUpload], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });

      // Add password and additional details to the file object for the upload service
      fileWithPassword.password = currentPassword;
      fileWithPassword.QPdetails = QPdetails;
      fileWithPassword.Subcourse = Subcourse;
      fileWithPassword.subject = subject;
      fileWithPassword.session = session;
      fileWithPassword.semyear = semyear;
      fileWithPassword.group = group;
      fileWithPassword.startTime = startTime;
      fileWithPassword.endTime = endTime;

      const response = await uploadFile(fileWithPassword);
     

      if (response && response.data) {
        setUploadedFile({...response.data, password: currentPassword});
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
      // Define allowed file types and max size
      const allowedTypes = [
        'application/pdf', // PDF
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/zip' // .zip
      ];
      const maxSize = 10 * 1024 * 1024; // 10 MB

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        message.error('Invalid file type. Only PDF, Excel (.xlsx/.xls), Word (.docx/.doc), and ZIP files are allowed.');
        return false;
      }

      // Check file size
      if (file.size > maxSize) {
        message.error('File size exceeds 10 MB limit. Please select a smaller file.');
        return false;
      }

      // Log file details for debugging


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
    <Sidebar>
      <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        
          <Title level={3} style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
            <CloudUploadOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            File Upload
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Upload and secure your files with password protection
          </Text>
        

        {/* Error Alert */}
        {error && (
          <Alert
            message="Upload Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '16px', borderRadius: '6px' }}
          />
        )}

        {/* Main Upload Card */}
        <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Steps
            current={currentStep}
            size="small"
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
            style={{ marginBottom: '24px' }}
          />

          {uploadedFile ? (
            <div>
              <Result
                status="success"
                title={<span style={{ fontSize: '20px', fontWeight: '600' }}>File Uploaded Successfully!</span>}
                subTitle={<span style={{ fontSize: '14px' }}>Your file has been securely uploaded with password protection.</span>}
                icon={<FileProtectOutlined style={{ color: '#52c41a', fontSize: '48px' }} />}
                style={{ padding: '20px 16px' }}
              />

              <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
                {/* File Details Card */}
                <Col xs={24} md={12} lg={8}>
                  <Card
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                        <FileProtectOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
                        File Details
                      </span>
                    }
                    size="small"
                    style={{ borderRadius: '6px', height: '100%' }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px',
                     
                      borderRadius: '6px',
                      border: '2px solid #b7eb8f'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: '#52c41a',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                      }}>
                        <FileProtectOutlined style={{ fontSize: '16px', color: 'white' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '14px',
                          wordBreak: 'break-word',
                          marginBottom: '2px'
                        }}>
                          {uploadedFile.filename}
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Uploaded {new Date(uploadedFile.uploadedAt).toLocaleString()}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* Share Information Card */}
                <Col xs={24} md={12} lg={8}>
                  <Card
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                        <ShareAltOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                        Share Information
                      </span>
                    }
                    size="small"
                    style={{ borderRadius: '6px', height: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Share Link:</Text>
                        <Input
                          value={`${window.location.origin}/download/${uploadedFile.id || uploadedFile._id}`}
                          readOnly
                          size="small"
                          style={{ width: '100%' }}
                          addonAfter={
                            <Tooltip title="Copy Link with Password">
                              <CopyOutlined
                                onClick={handleCopyLink}
                                style={{ cursor: 'pointer', color: '#1890ff' }}
                              />
                            </Tooltip>
                          }
                        />
                      </div>

                      <div>
                        <Text strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Password:</Text>
                        <Input.Password
                          value={uploadedFile.password}
                          readOnly
                          size="small"
                          style={{ width: '100%' }}
                          addonAfter={
                            <Tooltip title="Copy Password">
                              <CopyOutlined
                                onClick={handleCopyPassword}
                                style={{ cursor: 'pointer', color: '#1890ff' }}
                              />
                            </Tooltip>
                          }
                          prefix={<LockOutlined style={{ color: '#ff4d4f' }} />}
                        />
                      </div>

                      <div style={{
                        background: '#fff7e6',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #ffe7ba'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <ExclamationCircleOutlined style={{
                            color: '#fa8c16',
                            fontSize: '14px',
                            marginRight: '6px',
                            marginTop: '1px'
                          }} />
                          <div>
                            <Text strong style={{ color: '#d46b08', display: 'block', marginBottom: '2px', fontSize: '12px' }}>
                              Security Note
                            </Text>
                            <Text style={{ fontSize: '11px', color: '#8c6e00' }}>
                              Password is included in the link for convenience. Downloaded file remains password-protected.
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>

              {/* Action Buttons */}
              <Row gutter={[12, 12]} style={{ marginTop: '20px' }}>
                <Col xs={24} sm={12} lg={4}>
                  <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    block
                    style={{
                      borderRadius: '6px',
                      height: '36px'
                    }}
                  >
                    <Link to="/dashboard" style={{ color: 'white' }}>
                      Back to Dashboard
                    </Link>
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <Button
                    icon={<UploadOutlined />}
                    block
                    onClick={() => {
                      setUploadedFile(null);
                      setCurrentStep(0);
                    }}
                    style={{
                      borderRadius: '6px',
                      height: '36px',
                      borderColor: '#d9d9d9'
                    }}
                  >
                    Upload Another
                  </Button>
                </Col>
              </Row>
            </div>
          ) : (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                borderRadius: '8px',
                padding: '24px 16px',
                border: '2px dashed #91d5ff',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <Dragger {...props} style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0'
                }}>
                  <div style={{ padding: '16px' }}>
                    <CloudUploadOutlined style={{
                      fontSize: '36px',
                      color: '#52c41a',
                      marginBottom: '12px'
                    }} />
                    <Title level={4} style={{ margin: '0 0 8px 0', color: '#262626', fontSize: '16px' }}>
                      Drop your file here or click to browse
                    </Title>
                             
                  </div>
                </Dragger>
              </div>

              {/* Password Generation Section */}
              <Card 
                size="small" 
                style={{ 
                  marginBottom: '16px', 
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #fff7e6 0%, #f6ffed 100%)',
                  border: '1px solid #ffe7ba'
                }}
                title={
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <LockOutlined style={{ marginRight: '6px', color: '#fa8c16' }} />
                    File Password
                  </span>
                }
              >
                <Row gutter={[12, 12]} align="middle">
                  <Col xs={24} sm={16}>
                    {useCustomPassword ? (
                      <Input.Password
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Enter custom password (min 8 characters)"
                        size="large"
                        style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '16px',
                          fontWeight: '600',
                          letterSpacing: '2px'
                        }}
                        prefix={<LockOutlined style={{ color: '#fa8c16' }} />}
                        addonAfter={
                          <Tooltip title="Copy Password">
                            <CopyOutlined
                              onClick={() => {
                                navigator.clipboard.writeText(customPassword);
                                message.success('Password copied to clipboard!');
                              }}
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                            />
                          </Tooltip>
                        }
                      />
                    ) : (
                      <Input.Password
                        value={generatedPassword}
                        readOnly
                        size="large"
                        style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '16px',
                          fontWeight: '600',
                          letterSpacing: '2px'
                        }}
                        prefix={<LockOutlined style={{ color: '#fa8c16' }} />}
                        addonAfter={
                          <Tooltip title="Copy Password">
                            <CopyOutlined
                              onClick={() => {
                                navigator.clipboard.writeText(generatedPassword);
                                message.success('Password copied to clipboard!');
                              }}
                              style={{ cursor: 'pointer', color: '#1890ff' }}
                            />
                          </Tooltip>
                        }
                      />
                    )}
                  </Col>
                  <Col xs={24} sm={8}>
                    {useCustomPassword ? (
                      <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setUseCustomPassword(false);
                          setCustomPassword('');
                        }}
                        style={{
                          borderRadius: '6px',
                          height: '40px',
                          width: '100%',
                          borderColor: '#52c41a',
                          color: '#52c41a'
                        }}
                      >
                        Use Auto
                      </Button>
                    ) : (
                      <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={generatePassword}
                        style={{
                          borderRadius: '6px',
                          height: '40px',
                          width: '100%',
                          borderColor: '#fa8c16',
                          color: '#fa8c16'
                        }}
                      >
                        Generate New
                      </Button>
                    )}
                  </Col>
                </Row>
                
                {/* Toggle between auto and custom password */}
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setUseCustomPassword(!useCustomPassword)}
                    style={{ fontSize: '20px', padding: '0' }}
                  >
                    {useCustomPassword ? 'Use auto-generated password' : 'Use custom password'}
                  </Button>
                  
                  {useCustomPassword && (
                    <div style={{ marginTop: '4px' }}>
                      <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>
                        Custom password must be at least 8 characters long
                      </Text>
                    </div>
                  )}
                </div>
               

                {/* File Timing Section */}
                <div style={{ marginTop: '16px' }}>
                 

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#262626',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          🟢 Start Time
                          <Text style={{ fontSize: '11px', color: '#8c8c8c', marginLeft: '4px' }}>(Optional)</Text>
                        </Text>
                        <DatePicker
                          value={startTime ? dayjs(startTime) : null}
                          onChange={(date) => setStartTime(date ? date.toISOString() : '')}
                          showTime={{
                            defaultValue: dayjs('00:00:00', 'HH:mm:ss'),
                          }}
                          format="YYYY-MM-DD HH:mm:ss"
                          placeholder="Select when file becomes available"
                          size="small"
                          style={{
                            marginTop: '6px',
                            width: '100%',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#262626',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          🔴 End Time
                          <Text style={{ fontSize: '11px', color: '#8c8c8c', marginLeft: '4px' }}>(Optional)</Text>
                        </Text>
                        <DatePicker
                          value={endTime ? dayjs(endTime) : null}
                          onChange={(date) => setEndTime(date ? date.toISOString() : '')}
                          showTime={{
                            defaultValue: dayjs('23:59:59', 'HH:mm:ss'),
                          }}
                          format="YYYY-MM-DD HH:mm:ss"
                          placeholder="Select when file expires"
                          size="small"
                          style={{
                            marginTop: '6px',
                            width: '100%',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                  <div style={{
                    background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    marginTop: '12px',
                    border: '1px solid #b7eb8f',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Text style={{
                      fontSize: '12px',
                      color: '#389e0d',
                      fontWeight: '500'
                    }}>
                      <InfoCircleOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
                      Set timing restrictions for file availability. Leave empty for unrestricted access.
                    </Text>
                  </div>
                </div>
                
                {/* Password Strength Indicator */}
                <div style={{ marginTop: '8px' }}>
                  <Text style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px', display: 'block' }}>
                    Password Strength:
                  </Text>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(5)].map((_, index) => {
                      const currentPassword = useCustomPassword ? customPassword : generatedPassword;
                      let color = '#f0f0f0';

                      if (currentPassword.length >= 8) {
                        if (index < 2) color = '#ff4d4f'; // Weak
                        else if (index < 4) color = '#faad14'; // Medium
                        else color = '#52c41a'; // Strong
                      } else if (currentPassword.length >= 6) {
                        if (index < 3) color = '#faad14'; // Medium
                        else color = '#52c41a'; // Strong
                      } else if (currentPassword.length >= 4) {
                        color = '#52c41a'; // Strong
                      }

                      return (
                        <div
                          key={index}
                          style={{
                            width: '20px',
                            height: '4px',
                            backgroundColor: color,
                            borderRadius: '2px',
                            transition: 'background-color 0.3s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                  <Text style={{
                    fontSize: '11px',
                    color: (useCustomPassword ? customPassword : generatedPassword).length >= 8 ? '#52c41a' : '#faad14',
                    marginTop: '4px',
                    display: 'block'
                  }}>
                    {(useCustomPassword ? customPassword : generatedPassword).length >= 8 ? 'Strong Password' : 'Password too short'}
                  </Text>
                </div>

                {/* Group Selection - Only for Admins */}
                {user?.role?.name === 'admin' && (
                  <div style={{ marginTop: '16px' }}>
                    <Text style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <TeamOutlined style={{ marginRight: '6px', color: '#1890ff', fontSize: '14px' }} />
                      Group/University
                    </Text>
                    <Select
                      value={group}
                      onChange={(value) => setGroup(value)}
                      placeholder="Select group/university"
                      size="small"
                      style={{ marginTop: '6px', width: '45%' }}
                      showSearch
                    >
                      {availableGroups.map(groupName => (
                        <Select.Option key={groupName} value={groupName}>
                          {groupName}
                        </Select.Option>
                      ))}
                    </Select>
                    <div>
                      <Text style={{
                        fontSize: '12px',
                       
                        fontWeight: '500'
                      }}>
                        <InfoCircleOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
                        Select the university/group this file belongs to. Only users from this group will see this file.
                      </Text>
                    </div>
                  </div>
                )}
              </Card>

              {/* Additional File Details Section (Admin Only) */}
              {user?.role?.name === 'admin' && (
                <Card
                  size="small"
                  style={{
                    marginBottom: '16px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
                    border: '1px solid #91d5ff'
                  }}
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <FileProtectOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                      Paper Details
                    </span>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px', fontWeight: '500', color: '#262626' }}>QP Details</Text>
                        <Input
                          value={QPdetails}
                          onChange={(e) => setQPdetails(e.target.value)}
                          placeholder="Enter QP details"
                          size="small"
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px', fontWeight: '500', color: '#262626' }}>Subcourse</Text>
                        <Input
                          value={Subcourse}
                          onChange={(e) => setSubcourse(e.target.value)}
                          placeholder="Enter subcourse"
                          size="small"
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px', fontWeight: '500', color: '#262626' }}>Subject</Text>
                        <Input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Enter subject"
                          size="small"
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px', fontWeight: '500', color: '#262626' }}>Session</Text>
                        <Select
                          value={session}
                          onChange={(value) => setSession(value)}
                          placeholder="Select session"
                          size="small"
                          style={{ marginTop: '4px', width: '100%' }}
                          allowClear
                          showSearch
                        >
                          {(() => {
                            const currentYear = new Date().getFullYear();
                            const sessions = [];
                            // Previous 5 years
                            for (let i = 5; i >= 1; i--) {
                              const year = currentYear - i;
                              sessions.push(
                                <Select.Option key={`prev-${year}`} value={`${year}-${year + 1}`}>
                                  {year}-{year + 1}
                                </Select.Option>
                              );
                            }
                            // Current year
                            sessions.push(
                              <Select.Option key={`current-${currentYear}`} value={`${currentYear}-${currentYear + 1}`}>
                                {currentYear}-{currentYear + 1} (Current)
                              </Select.Option>
                            );
                            // Next 5 years
                            for (let i = 1; i <= 5; i++) {
                              const year = currentYear + i;
                              sessions.push(
                                <Select.Option key={`next-${year}`} value={`${year}-${year + 1}`}>
                                  {year}-{year + 1}
                                </Select.Option>
                              );
                            }
                            return sessions;
                          })()}
                        </Select>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '13px', fontWeight: '500', color: '#262626' }}>Sem/Year</Text>
                        <Input
                          value={semyear}
                          onChange={(e) => setSemyear(e.target.value)}
                          placeholder="Enter semester/year"
                          size="small"
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  type="primary"
                  onClick={handleUpload}
                  disabled={fileList.length === 0}
                  loading={uploading}
                  icon={<UploadOutlined />}
                  style={{
                    borderRadius: '6px',
                    height: '36px',
                    fontSize: '14px',
                    fontWeight: '600',
                    paddingLeft: '24px',
                    paddingRight: '24px'
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>

              {uploading && (
                <Card style={{
                  borderRadius: '6px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f6ffed 0%, #fff2e8 100%)',
                  marginTop: '16px'
                }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Progress
                      percent={99}
                      status="active"
                      strokeColor={{
                        '0%': '#52c41a',
                        '100%': '#389e0d',
                      }}
                      strokeWidth={6}
                      size="small"
                    />
                    <div>
                      <SafetyOutlined style={{ fontSize: '18px', color: '#52c41a', marginBottom: '6px' }} />
                      <Text style={{ display: 'block', fontSize: '14px', fontWeight: '500' }}>
                        Encrypting and uploading your file...
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Please wait while we secure your file
                      </Text>
                    </div>
                  </Space>
                </Card>
              )}
            </>
          )}
        </Card>
      </div>
    </Sidebar>
  );
};

export default FileUpload;

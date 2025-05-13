import { useState, useContext, useEffect } from 'react';
import {
  Typography,
  Form,
  Input,
  Button,
  Card,
  Avatar,
  Upload,
  Row,
  Col,
  Divider,
  Spin,
  Tag,
  App,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  EditOutlined,
  CameraOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Profile = () => {
  const { user, updateUserProfile, uploadUserProfilePicture, loading } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { message } = App.useApp();

  // Custom CSS for avatar hover effect
  const avatarOverlayStyle = `
    .avatar-upload-wrapper:hover .avatar-overlay {
      opacity: 1 !important;
    }
  `;

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        bio: user.bio || ''
      });
    }
  }, [user, form]);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleSubmit = async (values) => {
    try {
      await updateUserProfile({
        name: values.name,
        bio: values.bio
      });
      setEditing(false);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  const handleProfilePictureUpload = async () => {
    if (fileList.length === 0) {
      return message.error('Please select an image to upload');
    }

    const file = fileList[0].originFileObj;

    try {
      setUploading(true);
      const result = await uploadUserProfilePicture(file);
      console.log('Profile picture upload successful:', result);

      // Clear the file list
      setFileList([]);

      // Force a re-render to ensure the new profile picture is displayed
      // This is already handled by the AuthContext updating the user state

      message.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      message.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // Check file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }

      // Check file size (2MB limit)
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }

      setFileList([{
        uid: '-1',
        name: file.name,
        status: 'ready',
        url: URL.createObjectURL(file),
        originFileObj: file
      }]);

      return false;
    },
    fileList,
    maxCount: 1,
    listType: 'picture'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <DashboardLayout>
      {/* Add style tag for custom CSS */}
      <style>{avatarOverlayStyle}</style>

      <div className="profile-container">
        <Title level={2} style={{ marginBottom: '24px' }}>
          <UserOutlined style={{ marginRight: '12px' }} />
          My Profile
        </Title>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card
              className="profile-card"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Upload {...uploadProps}>
                  <Tooltip title="Click to update profile picture">
                    <div className="avatar-upload-wrapper" style={{
                      display: 'inline-block',
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      transition: 'all 0.3s ease'
                    }}>
                      <Avatar
                        size={120}
                        src={user?.profilePicture ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.profilePicture}` : null}
                        style={{
                          backgroundColor: user?.profilePicture ? 'transparent' : '#00BF96',
                          boxShadow: '0 4px 12px rgba(0, 191, 150, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '36px',
                          fontWeight: 'bold',
                          border: '4px solid #f5f5f5'
                        }}
                        onError={() => {
                          console.log('Avatar image failed to load');
                          // The fallback to showing the user initial is handled automatically by Ant Design
                        }}
                      >
                        {!user?.profilePicture && user?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ':hover': { opacity: 1 }
                      }} className="avatar-overlay">
                        <CameraOutlined style={{ fontSize: '24px', color: 'white' }} />
                      </div>
                    </div>
                  </Tooltip>
                </Upload>

                {fileList.length > 0 && (
                  <Button
                    type="primary"
                    onClick={handleProfilePictureUpload}
                    loading={uploading}
                    size="small"
                    style={{
                      marginTop: '8px',
                      borderRadius: '20px',
                      background: '#00BF96',
                      border: 'none'
                    }}
                  >
                    Upload New Picture
                  </Button>
                )}

                <Title level={4} style={{ marginTop: '16px', marginBottom: '4px' }}>
                  {user?.name}
                </Title>
                <Text type="secondary">{user?.email}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag color={user?.role === 'admin' ? '#00BF96' : '#1890ff'}>
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </Tag>
                </div>
              </div>

              <Divider />

              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                  <ClockCircleOutlined style={{ marginRight: '8px' }} />
                  Last Login:
                </Text>
                <Text>{formatDate(user?.lastLogin)}</Text>
              </div>

              {user?.lastLoginLocation && (
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                    <EnvironmentOutlined style={{ marginRight: '8px' }} />
                    Last Location:
                  </Text>
                  <Text>
                    {user.lastLoginLocation.city}, {user.lastLoginLocation.country}
                  </Text>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card
              className="profile-card"
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: '8px', color: '#00BF96' }} />
                  Profile Information
                </div>
              }
              extra={
                <Button
                  type={editing ? 'primary' : 'default'}
                  icon={editing ? <SaveOutlined /> : <EditOutlined />}
                  onClick={handleEditToggle}
                  className={editing ? 'gradient-button' : ''}
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
              }
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    name: user?.name || '',
                    email: user?.email || '',
                    bio: user?.bio || ''
                  }}
                >
                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[
                      { required: true, message: 'Please enter your name' },
                      { max: 50, message: 'Name cannot be longer than 50 characters' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#00BF96' }} />}
                      placeholder="Your full name"
                      disabled={!editing}
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email Address"
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: '#00BF96' }} />}
                      placeholder="Your email address"
                      disabled={true}
                    />
                  </Form.Item>

                  <Form.Item
                    name="bio"
                    label="Bio"
                    rules={[
                      { max: 200, message: 'Bio cannot be longer than 200 characters' }
                    ]}
                  >
                    <TextArea
                      placeholder="Tell us a bit about yourself"
                      autoSize={{ minRows: 3, maxRows: 6 }}
                      disabled={!editing}
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>

                  {editing && (
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="gradient-button"
                        style={{
                          width: '100%',
                          background: '#00BF96',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0, 191, 150, 0.2)'
                        }}
                      >
                        Save Changes
                      </Button>
                    </Form.Item>
                  )}
                </Form>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

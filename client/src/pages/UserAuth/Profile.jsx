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
import Sidebar from '../../components/Sidebar';
import AuthContext from '../../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Profile = () => {
  const { user, updateUserProfile, uploadUserProfilePicture, loading } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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
      // Update refresh key when user data changes
      setRefreshKey(prev => prev + 1);
    }
  }, [user, form]);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleSubmit = async (values) => {
    try {
      const result = await updateUserProfile({
        name: values.name,
        bio: values.bio
      });

      // Update form with the latest data from the response
      if (result && result.data && result.data.data) {
        form.setFieldsValue({
          name: result.data.data.name,
          email: result.data.data.email,
          bio: result.data.data.bio || ''
        });
      }

      setEditing(false);
      setRefreshKey(prev => prev + 1); // Force re-render
      message.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
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
      setRefreshKey(prev => prev + 1);

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
    <Sidebar>
      {/* Add style tag for custom CSS */}
      <style>{avatarOverlayStyle}</style>

      <div className="profile-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Title level={4} style={{ marginBottom: '16px', fontSize: '18px' }}>
          <UserOutlined style={{ marginRight: '8px', fontSize: '16px' }} />
          My Profile
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card
              className="profile-card"
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                padding: '12px'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
                        key={`${user?.profilePicture || 'default'}-${refreshKey}`}
                        size={80}
                        src={user?.profilePicture ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.profilePicture}?v=${refreshKey}` : null}
                        style={{
                          backgroundColor: user?.profilePicture ? 'transparent' : '#00BF96',
                          boxShadow: '0 2px 6px rgba(0, 191, 150, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          border: '2px solid #f5f5f5'
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
                        <CameraOutlined style={{ fontSize: '18px', color: 'white' }} />
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
                      marginTop: '6px',
                      borderRadius: '16px',
                      background: '#00BF96',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  >
                    Upload New Picture
                  </Button>
                )}

                <Title level={5} style={{ marginTop: '12px', marginBottom: '2px', fontSize: '16px' }} key={`name-${refreshKey}`}>
                  {user?.name}
                </Title>
                <Text type="secondary" style={{ fontSize: '13px' }} key={`email-${refreshKey}`}>{user?.email}</Text>
                <div style={{ marginTop: '6px' }} key={`role-${refreshKey}`}>
                  <Tag color={user?.role === 'admin' ? '#00BF96' : '#1890ff'} style={{ fontSize: '12px' }}>
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </Tag>
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ marginBottom: '10px' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                  <ClockCircleOutlined style={{ marginRight: '6px', fontSize: '12px' }} />
                  Last Login:
                </Text>
                <Text style={{ fontSize: '13px' }}>{formatDate(user?.lastLogin)}</Text>
              </div>

              {user?.lastLoginLocation && (
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
                    <EnvironmentOutlined style={{ marginRight: '6px', fontSize: '12px' }} />
                    Last Location:
                  </Text>
                  <Text style={{ fontSize: '13px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <InfoCircleOutlined style={{ marginRight: '6px', color: '#00BF96', fontSize: '14px' }} />
                  Profile Information
                </div>
              }
              extra={
                <Button
                  type={editing ? 'primary' : 'default'}
                  icon={editing ? <SaveOutlined style={{ fontSize: '12px' }} /> : <EditOutlined style={{ fontSize: '12px' }} />}
                  onClick={handleEditToggle}
                  className={editing ? 'gradient-button' : ''}
                  size="small"
                  style={{ fontSize: '12px' }}
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
              }
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <Spin size="default" />
                </div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  size="middle"
                  initialValues={{
                    name: user?.name || '',
                    email: user?.email || '',
                    bio: user?.bio || ''
                  }}
                >
                  <Form.Item
                    name="name"
                    label={<span style={{ fontSize: '14px' }}>Full Name</span>}
                    rules={[
                      { required: true, message: 'Please enter your name' },
                      { max: 50, message: 'Name cannot be longer than 50 characters' }
                    ]}
                    style={{ marginBottom: '16px' }}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#00BF96', fontSize: '14px' }} />}
                      placeholder="Your full name"
                      disabled={!editing}
                      style={{ fontSize: '14px' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label={<span style={{ fontSize: '14px' }}>Email Address</span>}
                    style={{ marginBottom: '16px' }}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: '#00BF96', fontSize: '14px' }} />}
                      placeholder="Your email address"
                      disabled={true}
                      style={{ fontSize: '14px' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="bio"
                    label={<span style={{ fontSize: '14px' }}>Bio</span>}
                    rules={[
                      { max: 200, message: 'Bio cannot be longer than 200 characters' }
                    ]}
                    style={{ marginBottom: '16px' }}
                  >
                    <TextArea
                      placeholder="Tell us a bit about yourself"
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      disabled={!editing}
                      maxLength={200}
                      showCount
                      style={{ fontSize: '14px' }}
                    />
                  </Form.Item>

                  {editing && (
                    <Form.Item style={{ marginBottom: '0' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="gradient-button"
                        size="middle"
                        style={{
                          width: '50%',
                          background: '#00BF96',
                          border: 'none',
                          boxShadow: '0 2px 6px rgba(0, 191, 150, 0.2)',
                          fontSize: '14px'
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
    </Sidebar>
  );
};

export default Profile;

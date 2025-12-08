import { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Upload,
  Button,
  Card,
  Row,
  Col,
  Spin,
  Alert,
  App,
  Image,
  Space,
  Divider,
  Tag
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  TeamOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import AuthContext from '../../context/AuthContext';
import { getUsers } from '../../api/userService';
import {
  uploadGroupImage,
  deleteGroupImage,
  getAllGroupImages
} from '../../api/settingsService';
import { hasPermission } from '../../utils/permissions';
import { storage } from '../../utils/storage';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const Groupimage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupImages, setGroupImages] = useState({});
  const [uploading, setUploading] = useState({});
  const { message } = App.useApp();

  // Check permissions
  const canAccessSettings = hasPermission(user, 'settings', 'read');
  const canUpdateSettings = hasPermission(user, 'settings', 'update');

  useEffect(() => {
    if (canAccessSettings) {
      fetchGroups();
      fetchGroupImages();
    }

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(groupImages).forEach(imageData => {
        if (imageData?.url && imageData.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageData.url);
        }
      });
    };
  }, [canAccessSettings]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      if (response.data) {
        const uniqueGroups = [...new Set(response.data.map(user => user.group).filter(group => group))];
        setGroups(uniqueGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      message.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupImages = async () => {
    try {
      const response = await getAllGroupImages();
      const images = {};

      // Create object URLs for each group image
      for (const [groupName, imageData] of Object.entries(response.data)) {
        try {
          // Fetch the image as blob
          const imageResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/group-image/${groupName}`, {
            headers: {
              'Authorization': `Bearer ${storage.getToken()}`
            }
          });

          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            images[groupName] = {
              url: URL.createObjectURL(blob),
              filename: imageData.filename,
              uploadedAt: imageData.uploadedAt
            };
          }
        } catch (error) {
          console.error(`Failed to load image for group ${groupName}:`, error);
        }
      }

      setGroupImages(images);
    } catch (error) {
      console.error('Error fetching group images:', error);
      message.error('Failed to load group images');
    }
  };

  const handleImageUpload = async (file, groupName) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      message.error('Please upload only image files (JPEG, PNG, GIF)');
      return false;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('Image size must be less than 2MB');
      return false;
    }

    setUploading(prev => ({ ...prev, [groupName]: true }));

    try {
      await uploadGroupImage(groupName, file);

      // Fetch the uploaded image as blob to create object URL
      try {
        const imageResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/group-image/${groupName}`, {
          headers: {
            'Authorization': `Bearer ${storage.getToken()}`
          }
        });

        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          const newGroupImages = {
            ...groupImages,
            [groupName]: {
              url: URL.createObjectURL(blob),
              filename: file.name,
              uploadedAt: new Date().toISOString()
            }
          };
          setGroupImages(newGroupImages);
        }
      } catch (fetchError) {
        console.error('Error fetching uploaded image:', fetchError);
      }

      message.success(`Image uploaded successfully for group: ${groupName}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Failed to upload image');
    } finally {
      setUploading(prev => ({ ...prev, [groupName]: false }));
    }

    return false; // Prevent default upload behavior
  };

  const handleImageDelete = async (groupName) => {
    try {
      await deleteGroupImage(groupName);

      const newGroupImages = { ...groupImages };
      delete newGroupImages[groupName];
      setGroupImages(newGroupImages);

      message.success(`Image removed for group: ${groupName}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      message.error('Failed to delete image');
    }
  };

  const uploadProps = (groupName) => ({
    beforeUpload: (file) => handleImageUpload(file, groupName),
    showUploadList: false,
    disabled: !canUpdateSettings || uploading[groupName]
  });

  if (!canAccessSettings) {
    return (
      <Sidebar>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access settings."
            type="error"
            showIcon
          />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link to="/settings">
            <Button
              type="default"
              icon={<ArrowLeftOutlined />}
              style={{ marginBottom: '16px' }}
            >
              Back to Settings
            </Button>
          </Link>
          <Title level={3} style={{ margin: '0 0 8px 0' }}>
            <TeamOutlined style={{ marginRight: '12px' }} />
            Group Image Settings
          </Title>
        </div>

        <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
          Upload and manage images for each group. These images will be displayed in the header when viewing group-specific content.
        </Text>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {groups.map(groupName => (
              <Col xs={24} sm={12} lg={8} xl={6} key={groupName}>
                <Card
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    height: '100%'
                  }}
                  title={
                    <Space>
                      <TeamOutlined />
                      <span>{groupName}</span>
                    </Space>
                  }
                >
                  <div style={{ textAlign: 'center' }}>
                    {groupImages[groupName] ? (
                      <div>
                        <Image
                          src={groupImages[groupName].url}
                          alt={`${groupName} group image`}
                          style={{
                            width: '100%',
                            maxWidth: '150px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            marginBottom: '12px'
                          }}
                          preview={{
                            mask: <EyeOutlined style={{ fontSize: '16px' }} />
                          }}
                        />
                        <div style={{ marginBottom: '12px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {groupImages[groupName].filename}
                          </Text>
                        </div>
                        <Space>
                          {canUpdateSettings && (
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleImageDelete(groupName)}
                            >
                              Remove
                            </Button>
                          )}
                        </Space>
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '150px',
                            height: '100px',
                            border: '2px dashed #d9d9d9',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            background: '#fafafa'
                          }}
                        >
                          <Text type="secondary">No Image</Text>
                        </div>
                        {canUpdateSettings && (
                          <Upload {...uploadProps(groupName)}>
                            <Button
                              type="primary"
                              icon={<UploadOutlined />}
                              size="small"
                              loading={uploading[groupName]}
                            >
                              {uploading[groupName] ? 'Uploading...' : 'Upload Image'}
                            </Button>
                          </Upload>
                        )}
                      </div>
                    )}
                  </div>

                  {!canUpdateSettings && (
                    <Divider style={{ margin: '12px 0' }} />
                  )}

                  {!canUpdateSettings && (
                    <Alert
                      message="Read-only"
                      description="You can view but not modify group images."
                      type="warning"
                      showIcon
                      style={{ fontSize: '12px' }}
                    />
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {groups.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <TeamOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4} type="secondary">No Groups Found</Title>
            <Text type="secondary">There are no user groups configured in the system.</Text>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default Groupimage;
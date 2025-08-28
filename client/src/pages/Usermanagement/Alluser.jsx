import { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Popconfirm,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Avatar,
  Tag,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic,
  App
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  LockOutlined,
  TeamOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/userService';
import { getRoles } from '../../api/roleService';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const { message } = App.useApp();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection using window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      message.error('Failed to fetch roles');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const showCreateModal = () => {
    setModalType('create');
    setSelectedUser(null);
    form.resetFields();
    // Set default role to 'user' role if available
    const defaultRole = roles.find(role => role.name === 'user');
    if (defaultRole) {
      form.setFieldsValue({ role: defaultRole._id });
    }
    setModalVisible(true);
  };

  const showEditModal = (user) => {
    setModalType('edit');
    setSelectedUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role?._id || user.role
    });
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (modalType === 'create') {
        await createUser(values);
        message.success('User created successfully');
      } else {
        await updateUser(selectedUser._id, values);
        message.success('User updated successfully');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to delete user');
    }
  };

  // Get user statistics
  const getUserStats = () => {
    const totalUsers = users.length;
    const adminUsers = users.filter(user =>
      user.role?.name === 'admin' || user.role === 'admin'
    ).length;
    const regularUsers = totalUsers - adminUsers;
    const activeUsers = users.filter(user => user.lastLogin).length;

    return {
      totalUsers,
      adminUsers,
      regularUsers,
      activeUsers
    };
  };

  const stats = getUserStats();

  // Get random color for avatar based on name
  const getAvatarColor = (name) => {
    const colors = [
      '#00BF96', '#1890ff', '#f56a00', '#7265e6', '#ffbf00',
      '#00a2ae', '#ff5500', '#52c41a'
    ];

    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name?.length || 0; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  // Responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'SN.',
        key: 'serialNumber',
        width: isMobile ? '15%' : '8%',
        render: (_, __, index) => (
          <div style={{ textAlign: 'center', fontWeight: '500' }}>
            {index + 1}
          </div>
        ),
      },
      {
        title: 'User',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              size={isMobile ? 'small' : 'default'}
              style={{
                backgroundColor: getAvatarColor(text),
                marginRight: isMobile ? '8px' : '12px'
              }}
            >
              {text?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div style={{ 
                fontWeight: '500', 
                fontSize: isMobile ? '14px' : '16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {text}
              </div>
              <div style={{ 
                fontSize: isMobile ? '11px' : '12px', 
                color: '#8c8c8c',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {record.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        width: isMobile ? '25%' : '15%',
        render: (role) => {
          const roleName = role?.name || role;
          const roleDisplay = role?.displayName || roleName;
          const isAdmin = roleName === 'admin';

          return (
            <Tag 
              color={isAdmin ? '#00BF96' : '#1890ff'} 
              style={{ 
                borderRadius: '12px', 
                padding: isMobile ? '0 6px' : '0 8px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              <Space size={isMobile ? 'small' : 'middle'}>
                {isAdmin ? <SafetyOutlined /> : <UserOutlined />}
                <span style={{ display: isMobile && roleDisplay.length > 8 ? 'none' : 'inline' }}>
                  {isMobile && roleDisplay.length > 8 ? roleDisplay.substring(0, 6) + '...' : roleDisplay}
                </span>
              </Space>
            </Tag>
          );
        },
      }
    ];

    // Add conditional columns based on screen size
    if (!isMobile) {
      baseColumns.push(
        {
          title: 'Last Login',
          dataIndex: 'lastLogin',
          key: 'lastLogin',
          width: '20%',
          render: (date, record) => (
            date ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={{ color: '#8c8c8c', marginRight: '6px' }} />
                  <span>{new Date(date).toLocaleString()}</span>
                </div>
                {record.lastLoginLocation && (
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    <EnvironmentOutlined style={{ marginRight: '6px' }} />
                    {record.lastLoginLocation.city || 'Unknown'}, {record.lastLoginLocation.country || 'Unknown'}
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary">Never</Text>
            )
          ),
        },
        {
          title: 'Created',
          dataIndex: 'createdAt',
          key: 'createdAt',
          width: '15%',
          render: (date) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ClockCircleOutlined style={{ color: '#8c8c8c', marginRight: '6px' }} />
              <span>{new Date(date).toLocaleDateString()}</span>
            </div>
          ),
        }
      );
    }

    // Add actions column
    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      width: isMobile ? '25%' : '20%',
      render: (_, record) => (
        <Space size={isMobile ? 'small' : 'middle'} direction={isMobile ? 'vertical' : 'horizontal'}>
          <Tooltip title="Edit User">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              shape={isMobile ? 'default' : 'circle'}
              size={isMobile ? 'small' : 'middle'}
              className="gradient-button"
            >
              {isMobile && 'Edit'}
            </Button>
          </Tooltip>
          <Tooltip title="Delete User">
            <Popconfirm
              title="Delete this user?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                shape={isMobile ? 'default' : 'circle'}
                size={isMobile ? 'small' : 'middle'}
              >
                {isMobile && 'Delete'}
              </Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    });

    return baseColumns;
  };

  const columns = getColumns();

  return (
    <Sidebar>
      <div className="fade-in">
        <div style={{ 
          marginBottom: '24px',
          padding: isMobile ? '16px' : '24px',
          paddingTop: isMobile ? '16px' : '24px'
        }}>
          <Title 
            level={isMobile ? 4 : 3} 
            style={{ 
              margin: '0 0 8px 0',
              fontSize: isMobile ? '20px' : '24px'
            }}
          >
            User Management
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? '14px' : '16px' }}>
            Manage users and their access permissions
          </Text>
        </div>

        {/* Responsive Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px', padding: isMobile ? '0 16px' : '0' }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic
                title="Total Users"
                value={stats.totalUsers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic
                title="Admin Users"
                value={stats.adminUsers}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#00BF96' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic
                title="Regular Users"
                value={stats.regularUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic
                title="Active Users"
                value={stats.activeUsers}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#f56a00' }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          className="dashboard-card"
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TeamOutlined style={{ marginRight: '8px', fontSize: isMobile ? '16px' : '18px' }} />
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>All Users</span>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={showCreateModal}
              className="gradient-button"
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Add' : 'Add User'}
            </Button>
          }
          style={{ margin: isMobile ? '0 16px' : '0 24px' }}
        >
          <Table
            className="custom-table"
            columns={columns}
            dataSource={users}
            rowKey="_id"
            loading={loading}
            scroll={{ x: isMobile ? 600 : undefined }}
            pagination={{
              pageSize: isMobile ? 5 : 10,
              showTotal: (total) => `Total ${total} users`,
              showSizeChanger: !isMobile,
              pageSizeOptions: isMobile ? ['5', '10'] : ['10', '20', '50'],
              size: isMobile ? 'small' : 'default',
              position: isMobile ? ['bottomCenter'] : ['bottomRight']
            }}
            size={isMobile ? 'small' : 'default'}
          />
        </Card>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {modalType === 'create' ? (
              <>
                <UserAddOutlined style={{ fontSize: isMobile ? '18px' : '20px', marginRight: '8px', color: '#00BF96' }} />
                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                  {isMobile ? 'New User' : 'Create New User'}
                </span>
              </>
            ) : (
              <>
                <EditOutlined style={{ fontSize: isMobile ? '18px' : '20px', marginRight: '8px', color: '#00BF96' }} />
                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                  {isMobile ? 'Edit User' : 'Edit User'}
                </span>
              </>
            )}
          </div>
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        okText={modalType === 'create' ? 'Create' : 'Update'}
        okButtonProps={{
          className: 'gradient-button',
          style: { borderColor: 'transparent' }
        }}
        width={isMobile ? '95%' : 500}
        centered
        style={{ top: isMobile ? 20 : 100 }}
      >
        <Divider style={{ margin: '0 0 24px 0' }} />

        <Form
          form={form}
          layout="vertical"
          size={isMobile ? 'middle' : 'large'}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#00BF96' }} />}
              placeholder="Enter full name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#00BF96' }} />}
              placeholder="Enter email address"
            />
          </Form.Item>

          {modalType === 'create' && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
              extra="Password must be at least 6 characters"
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#00BF96' }} />}
                placeholder="Create a password"
              />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="User Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select placeholder="Select user role">
              {roles.map(role => (
                <Option key={role._id} value={role._id}>
                  <Space>
                    {role.name === 'admin' ? <SafetyOutlined /> : <UserOutlined />}
                    {role.displayName}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Sidebar>
  );
};

export default UserManagement;

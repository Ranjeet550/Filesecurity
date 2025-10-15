import { useState, useEffect, useContext } from 'react';
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
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  App,
  Transfer,
  Descriptions,
  Switch
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  SafetyOutlined,
  PlusOutlined,
  TeamOutlined,
  KeyOutlined,
  SettingOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import AuthContext from '../../context/AuthContext';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/roleService';
import { getPermissions } from '../../api/permissionService';
import { isAdmin } from '../../utils/permissions';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoleManagement = () => {
  const { message } = App.useApp();
  const { user } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);
  const [form] = Form.useForm();
  const [targetKeys, setTargetKeys] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} roles`
  });

  // Responsive detection using window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      message.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await getPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      message.error('Failed to fetch permissions');
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const showCreateModal = () => {
    setModalType('create');
    setSelectedRole(null);
    setTargetKeys([]);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (role) => {
    setModalType('edit');
    setSelectedRole(role);
    form.setFieldsValue({
      name: role.name,
      displayName: role.displayName,
      description: role.description
    });
    setTargetKeys(role.permissions?.map(p => p._id) || []);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setTargetKeys([]);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const roleData = {
        ...values,
        permissions: targetKeys
      };

      if (modalType === 'create') {
        await createRole(roleData);
        message.success('Role created successfully');
      } else {
        await updateRole(selectedRole._id, roleData);
        message.success('Role updated successfully');
      }

      setModalVisible(false);
      setTargetKeys([]);
      fetchRoles();
    } catch (error) {
      console.error('Form submission error:', error);

      // Handle form validation errors
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        const fieldName = firstError.name[0];
        const errorMessage = firstError.errors[0];

        // Provide more user-friendly error messages
        let friendlyMessage = errorMessage;
        if (fieldName === 'name' && errorMessage.includes('pattern')) {
          friendlyMessage = 'Role name must contain only letters and underscores (e.g., Manager, content_editor)';
        }

        message.error(friendlyMessage);
      } else {
        // Handle API errors
        message.error(error.message || 'Operation failed');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRole(id);
      message.success('Role permanently deleted successfully');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      message.error(error.message || 'Failed to delete role');
    }
  };

  const handleStatusToggle = async (roleId, currentStatus) => {
    if (!isAdmin(user)) {
      message.error('Only admin users can toggle role status');
      return;
    }

    const role = roles.find(r => r._id === roleId);
    if (!role) {
      message.error('Role not found');
      return;
    }

    if (role.name === 'admin') {
      message.error('Admin role status cannot be changed');
      return;
    }

    try {
      const newStatus = !currentStatus;
      await updateRole(roleId, { isActive: newStatus });
      message.success(`Role ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchRoles();
    } catch (error) {
      console.error('Error updating role status:', error);
      message.error(error.message || 'Failed to update role status');
    }
  };


  const transferDataSource = permissions.map(permission => ({
    key: permission._id,
    title: `${permission.module?.displayName} - ${permission.action.charAt(0).toUpperCase() + permission.action.slice(1)}`,
    description: permission.description
  }));

  // Responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Role',
        dataIndex: 'displayName',
        key: 'displayName',
        render: (text, record) => (
          <div>
            <div style={{ 
              fontWeight: '500', 
              display: 'flex', 
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
              <SafetyOutlined style={{ 
                marginRight: '8px', 
                color: '#00BF96',
                fontSize: isMobile ? '14px' : '16px'
              }} />
              <span style={{ 
                fontSize: isMobile ? '14px' : '16px',
                marginRight: '8px'
              }}>
                {text}
              </span>
              {record.isSystem && (
                <Tag 
                  color="blue" 
                  style={{ 
                    marginLeft: isMobile ? '4px' : '8px',
                    fontSize: isMobile ? '11px' : '12px'
                  }}
                >
                  System
                </Tag>
              )}
            </div>
            <div style={{ 
              fontSize: isMobile ? '11px' : '12px', 
              color: '#8c8c8c',
              marginTop: isMobile ? '4px' : '0'
            }}>
              {record.name}
            </div>
          </div>
        ),
      }
    ];

    // Add conditional columns based on screen size
    if (!isMobile) {
      baseColumns.push(
        {
          title: 'Description',
          dataIndex: 'description',
          key: 'description',
          render: (text) => text || 'No description'
        },
        {
          title: 'Permissions',
          dataIndex: 'permissions',
          key: 'permissions',
          render: (permissions) => (
            <div>
              <Text strong>{permissions?.length || 0}</Text>
              <Text type="secondary"> permissions</Text>
            </div>
          )
        }
      );
    }

    // Add status column for all screen sizes
    baseColumns.push({
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Switch
            checked={isActive}
            onChange={() => handleStatusToggle(record._id, isActive)}
            checkedChildren="Enable"
            unCheckedChildren="Disable"
            size={isMobile ? 'small' : 'default'}
            disabled={!isAdmin(user)}
          />
          <Tag color={isActive ? 'green' : 'red'} style={{ margin: 0 }}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
        </div>
      )
    });

    // Add actions column
    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      width: isMobile ? '30%' : '15%',
      render: (_, record) => (
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size={isMobile ? 'small' : 'middle'}>
          <Tooltip title="Edit Role">
            <Button
              type={isMobile ? 'default' : 'text'}
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              style={{ 
                color: '#00BF96',
                fontSize: isMobile ? '12px' : '14px'
              }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile && 'Edit'}
            </Button>
          </Tooltip>
          {!record.isSystem && (
            <Tooltip title="Delete Role">
              <Popconfirm
                title="Are you sure you want to delete this role?"
                description="This action cannot be undone. The role will be permanently removed from the system."
                onConfirm={() => handleDelete(record._id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type={isMobile ? 'default' : 'text'}
                  icon={<DeleteOutlined />}
                  danger
                  size={isMobile ? 'small' : 'middle'}
                >
                  {isMobile && 'Delete'}
                </Button>
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    });

    return baseColumns;
  };

  const columns = getColumns();

  const stats = {
    total: roles.length,
    active: roles.filter(role => role.isActive).length,
    system: roles.filter(role => role.isSystem).length
  };

  return (
    <Sidebar>
      <div style={{ 
        padding: isMobile ? '16px' : '24px',
        paddingTop: isMobile ? '16px' : '24px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <Title 
            level={isMobile ? 3 : 2} 
            style={{ 
              margin: 0, 
              color: '#1a1a1a',
              fontSize: isMobile ? '20px' : '24px'
            }}
          >
            <TeamOutlined style={{ 
              marginRight: '12px', 
              color: '#00BF96',
              fontSize: isMobile ? '18px' : '20px'
            }} />
            Role Management
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? '14px' : '16px' }}>
            Manage user roles and their permissions
          </Text>
        </div>

        {/* Responsive Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic
                title="Total Roles"
                value={stats.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic
                title="Active Roles"
                value={stats.active}
                prefix={<KeyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic
                title="System Roles"
                value={stats.system}
                prefix={<SettingOutlined />}
                valueStyle={{ color: '#00BF96' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Card>
          <div style={{ 
            marginBottom: '16px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : '0'
          }}>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>Roles</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              style={{ backgroundColor: '#00BF96', borderColor: '#00BF96' }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Add' : 'Add Role'}
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={roles}
            rowKey="_id"
            loading={loading}
            scroll={{ x: isMobile ? 600 : undefined }}
            pagination={{
              ...pagination,
              pageSize: isMobile ? 5 : pagination.pageSize,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: (total, range) =>
                isMobile ? `${total} roles` : `${range[0]}-${range[1]} of ${total} roles`,
              pageSizeOptions: isMobile ? ['5', '10'] : ['10', '20', '50'],
              size: isMobile ? 'small' : 'default',
              position: isMobile ? ['bottomCenter'] : ['bottomRight'],
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize
                }));
              },
              onShowSizeChange: (current, size) => {
                setPagination(prev => ({
                  ...prev,
                  current: 1,
                  pageSize: size
                }));
              }
            }}
            size={isMobile ? 'small' : 'default'}
          />
        </Card>

        {/* Role Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <SafetyOutlined style={{ 
                marginRight: '8px', 
                color: '#00BF96',
                fontSize: isMobile ? '16px' : '18px'
              }} />
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                {modalType === 'create' ? 'Create New Role' : 'Edit Role'}
              </span>
            </div>
          }
          open={modalVisible}
          onOk={handleModalSubmit}
          onCancel={handleModalCancel}
          width={isMobile ? '95%' : 800}
          okText={modalType === 'create' ? 'Create' : 'Update'}
          okButtonProps={{ style: { backgroundColor: '#00BF96', borderColor: '#00BF96' } }}
          centered
          style={{ top: isMobile ? 20 : 100 }}
        >
          <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
            <Row gutter={isMobile ? 0 : 16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Role Name"
                  rules={[
                    { required: true, message: 'Please enter role name' },
                    {
                      pattern: /^[a-zA-Z_]+$/,
                      message: 'Role name must contain only letters and underscores (e.g., Manager, content_editor)'
                    },
                    { min: 2, message: 'Role name must be at least 2 characters long' },
                    { max: 50, message: 'Role name cannot exceed 50 characters' }
                  ]}
                >
                  <Input
                    placeholder="e.g., Manager, content_editor"
                    size={isMobile ? 'middle' : 'large'}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="displayName"
                  label="Display Name"
                  rules={[
                    { required: true, message: 'Please enter display name' },
                    { min: 2, message: 'Display name must be at least 2 characters long' },
                    { max: 100, message: 'Display name cannot exceed 100 characters' }
                  ]}
                >
                  <Input
                    placeholder="e.g., Manager, Content Editor"
                    size={isMobile ? 'middle' : 'large'}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                { max: 500, message: 'Description cannot exceed 500 characters' }
              ]}
            >
              <TextArea
                rows={isMobile ? 2 : 3}
                placeholder="Describe the role and its responsibilities"
                size={isMobile ? 'middle' : 'large'}
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item label="Permissions">
              <Transfer
                dataSource={transferDataSource}
                targetKeys={targetKeys}
                onChange={setTargetKeys}
                render={item => item.title}
                titles={['Available Permissions', 'Assigned Permissions']}
                style={{ marginBottom: 16 }}
                listStyle={{ 
                  width: isMobile ? '100%' : 300, 
                  height: isMobile ? 200 : 300 
                }}
                showSearch
                filterOption={(inputValue, option) =>
                  option.title.toLowerCase().includes(inputValue.toLowerCase())
                }
                size={isMobile ? 'small' : 'default'}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Sidebar>
  );
};

export default RoleManagement;

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
  Tag,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic,
  App,
  Transfer,
  Descriptions
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  SafetyOutlined,
  PlusOutlined,
  TeamOutlined,
  KeyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/roleService';
import { getPermissions } from '../../api/permissionService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoleManagement = () => {
  const { message } = App.useApp();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);
  const [form] = Form.useForm();
  const [targetKeys, setTargetKeys] = useState([]);
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
      message.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRole(id);
      message.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      message.error(error.message || 'Failed to delete role');
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
        },
        {
          title: 'Status',
          dataIndex: 'isActive',
          key: 'isActive',
          render: (isActive) => (
            <Tag color={isActive ? 'green' : 'red'}>
              {isActive ? 'Active' : 'Inactive'}
            </Tag>
          )
        }
      );
    }

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
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record._id)}
                okText="Yes"
                cancelText="No"
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
              pageSize: isMobile ? 5 : 10,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: (total, range) => 
                isMobile ? `${total} roles` : `${range[0]}-${range[1]} of ${total} roles`,
              size: isMobile ? 'small' : 'default',
              position: isMobile ? ['bottomCenter'] : ['bottomRight']
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
                    { pattern: /^[a-z_]+$/, message: 'Role name must be lowercase with underscores only' }
                  ]}
                >
                  <Input 
                    placeholder="e.g., manager, editor" 
                    size={isMobile ? 'middle' : 'large'}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="displayName"
                  label="Display Name"
                  rules={[{ required: true, message: 'Please enter display name' }]}
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
            >
              <TextArea
                rows={isMobile ? 2 : 3}
                placeholder="Describe the role and its responsibilities"
                size={isMobile ? 'middle' : 'large'}
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

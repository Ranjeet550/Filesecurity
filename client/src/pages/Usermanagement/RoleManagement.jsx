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

  const columns = [
    {
      title: 'Role',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center' }}>
            <SafetyOutlined style={{ marginRight: '8px', color: '#00BF96' }} />
            {text}
            {record.isSystem && (
              <Tag color="blue" style={{ marginLeft: '8px' }}>System</Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.name}</div>
        </div>
      ),
    },
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
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Role">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              style={{ color: '#00BF96' }}
            />
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
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: roles.length,
    active: roles.filter(role => role.isActive).length,
    system: roles.filter(role => role.isSystem).length
  };

  return (
    <Sidebar>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
            <TeamOutlined style={{ marginRight: '12px', color: '#00BF96' }} />
            Role Management
          </Title>
          <Text type="secondary">Manage user roles and their permissions</Text>
        </div>

       

        {/* Main Content */}
        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Roles</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              style={{ backgroundColor: '#00BF96', borderColor: '#00BF96' }}
            >
              Add Role
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={roles}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} roles`
            }}
          />
        </Card>

        {/* Role Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <SafetyOutlined style={{ marginRight: '8px', color: '#00BF96' }} />
              {modalType === 'create' ? 'Create New Role' : 'Edit Role'}
            </div>
          }
          open={modalVisible}
          onOk={handleModalSubmit}
          onCancel={handleModalCancel}
          width={800}
          okText={modalType === 'create' ? 'Create' : 'Update'}
          okButtonProps={{ style: { backgroundColor: '#00BF96', borderColor: '#00BF96' } }}
        >
          <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Role Name"
                  rules={[
                    { required: true, message: 'Please enter role name' },
                    { pattern: /^[a-z_]+$/, message: 'Role name must be lowercase with underscores only' }
                  ]}
                >
                  <Input placeholder="e.g., manager, editor" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="displayName"
                  label="Display Name"
                  rules={[{ required: true, message: 'Please enter display name' }]}
                >
                  <Input placeholder="e.g., Manager, Content Editor" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea
                rows={3}
                placeholder="Describe the role and its responsibilities"
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
                listStyle={{ width: 300, height: 300 }}
                showSearch
                filterOption={(inputValue, option) =>
                  option.title.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Sidebar>
  );
};

export default RoleManagement;

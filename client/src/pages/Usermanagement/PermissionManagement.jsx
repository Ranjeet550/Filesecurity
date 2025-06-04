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
  Row,
  Col,
  Statistic,
  App
} from 'antd';
import {
  KeyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  AppstoreOutlined,
  SafetyOutlined,
  FileOutlined
} from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { getPermissions, createPermission, updatePermission, deletePermission } from '../../api/permissionService';
import { getModules } from '../../api/moduleService';

const { Title, Text } = Typography;
const { Option } = Select;

const PermissionManagement = () => {
  const { message } = App.useApp();
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [form] = Form.useForm();

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await getPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      message.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await getModules();
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      message.error('Failed to fetch modules');
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchModules();
  }, []);

  const showCreateModal = () => {
    setModalType('create');
    setSelectedPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (permission) => {
    setModalType('edit');
    setSelectedPermission(permission);
    form.setFieldsValue({
      name: permission.name,
      action: permission.action,
      module: permission.module._id,
      description: permission.description
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
        await createPermission(values);
        message.success('Permission created successfully');
      } else {
        await updatePermission(selectedPermission._id, values);
        message.success('Permission updated successfully');
      }

      setModalVisible(false);
      fetchPermissions();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePermission(id);
      message.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
      message.error(error.message || 'Failed to delete permission');
    }
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'green',
      read: 'blue',
      update: 'orange',
      delete: 'red'
    };
    return colors[action] || 'default';
  };

  const getActionIcon = (action) => {
    const icons = {
      create: <PlusOutlined />,
      read: <FileOutlined />,
      update: <EditOutlined />,
      delete: <DeleteOutlined />
    };
    return icons[action] || <KeyOutlined />;
  };

  const columns = [
    {
      title: 'Permission',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center' }}>
            <KeyOutlined style={{ marginRight: '8px', color: '#00BF96' }} />
            {text}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.module?.displayName}
          </div>
        </div>
      ),
    },
    {
      title: 'Module',
      dataIndex: ['module', 'displayName'],
      key: 'module',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AppstoreOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          {text}
        </div>
      )
    },
    
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || 'No description'
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
          <Tooltip title="Edit Permission">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              style={{ color: '#00BF96' }}
            />
          </Tooltip>
          <Tooltip title="Delete Permission">
            <Popconfirm
              title="Are you sure you want to delete this permission?"
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
        </Space>
      ),
    },
  ];

  const stats = {
    total: permissions.length,
    active: permissions.filter(permission => permission.isActive).length,
    byAction: permissions.reduce((acc, permission) => {
      acc[permission.action] = (acc[permission.action] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <Sidebar>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
            <KeyOutlined style={{ marginRight: '12px', color: '#00BF96' }} />
            Permission Management
          </Title>
          <Text type="secondary">Manage system permissions and access controls</Text>
        </div>

       

        {/* Main Content */}
        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Permissions</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              style={{ backgroundColor: '#00BF96', borderColor: '#00BF96' }}
            >
              Add Permission
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={permissions}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} permissions`
            }}
          />
        </Card>

        {/* Permission Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KeyOutlined style={{ marginRight: '8px', color: '#00BF96' }} />
              {modalType === 'create' ? 'Create New Permission' : 'Edit Permission'}
            </div>
          }
          open={modalVisible}
          onOk={handleModalSubmit}
          onCancel={handleModalCancel}
          width={600}
          okText={modalType === 'create' ? 'Create' : 'Update'}
          okButtonProps={{ style: { backgroundColor: '#00BF96', borderColor: '#00BF96' } }}
        >
          <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
            <Form.Item
              name="name"
              label="Permission Name"
              rules={[{ required: true, message: 'Please enter permission name' }]}
            >
              <Input placeholder="e.g., User Management - Create" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="module"
                  label="Module"
                  rules={[{ required: true, message: 'Please select module' }]}
                >
                  <Select placeholder="Select module">
                    {modules.map(module => (
                      <Option key={module._id} value={module._id}>
                        {module.displayName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="action"
                  label="Action"
                  rules={[{ required: true, message: 'Please select action' }]}
                >
                  <Select placeholder="Select action">
                    <Option value="create">Create</Option>
                    <Option value="read">Read</Option>
                    <Option value="update">Update</Option>
                    <Option value="delete">Delete</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Describe what this permission allows"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Sidebar>
  );
};

export default PermissionManagement;

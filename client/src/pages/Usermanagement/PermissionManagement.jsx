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

  // Responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Permission',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <div>
            <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <KeyOutlined style={{ marginRight: '8px', color: '#00BF96', fontSize: isMobile ? '14px' : '16px' }} />
              <span style={{ fontSize: isMobile ? '14px' : '16px' }}>{text}</span>
            </div>
            <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#8c8c8c', marginTop: isMobile ? '4px' : '0' }}>
              {record.module?.displayName}
            </div>
          </div>
        ),
      }
    ];

    if (!isMobile) {
      baseColumns.push(
        {
          title: 'Module',
          dataIndex: ['module', 'displayName'],
          key: 'module',
          render: (text) => (
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
        }
      );
    }

    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      width: isMobile ? '30%' : '15%',
      render: (_, record) => (
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size={isMobile ? 'small' : 'middle'}>
          <Tooltip title="Edit Permission">
            <Button
              type={isMobile ? 'default' : 'text'}
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              style={{ color: '#00BF96', fontSize: isMobile ? '12px' : '14px' }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile && 'Edit'}
            </Button>
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
                type={isMobile ? 'default' : 'text'}
                icon={<DeleteOutlined />}
                danger
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
      <div style={{ padding: isMobile ? '16px' : '24px', paddingTop: isMobile ? '16px' : '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: '#1a1a1a', fontSize: isMobile ? '20px' : '24px' }}>
            <KeyOutlined style={{ marginRight: '12px', color: '#00BF96', fontSize: isMobile ? '18px' : '20px' }} />
            Permission Management
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? '14px' : '16px' }}>Manage system permissions and access controls</Text>
        </div>

        {/* Responsive Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic title="Total Permissions" value={stats.total} prefix={<FileOutlined />} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic title="Active" value={stats.active} prefix={<SafetyOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-card" size={isMobile ? 'small' : 'default'}>
              <Statistic title="Create/Read/Update/Delete" value={`${stats.byAction.create || 0}/${stats.byAction.read || 0}/${stats.byAction.update || 0}/${stats.byAction.delete || 0}`} />
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '0' }}>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>Permissions</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              style={{ backgroundColor: '#00BF96', borderColor: '#00BF96' }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Add' : 'Add Permission'}
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={permissions}
            rowKey="_id"
            loading={loading}
            scroll={{ x: isMobile ? 700 : undefined }}
            pagination={{
              pageSize: isMobile ? 5 : 10,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: (total, range) => isMobile ? `${total} permissions` : `${range[0]}-${range[1]} of ${total} permissions`,
              size: isMobile ? 'small' : 'default',
              position: isMobile ? ['bottomCenter'] : ['bottomRight']
            }}
            size={isMobile ? 'small' : 'default'}
          />
        </Card>

        {/* Permission Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KeyOutlined style={{ marginRight: '8px', color: '#00BF96', fontSize: isMobile ? '16px' : '18px' }} />
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                {modalType === 'create' ? 'Create New Permission' : 'Edit Permission'}
              </span>
            </div>
          }
          open={modalVisible}
          onOk={handleModalSubmit}
          onCancel={handleModalCancel}
          width={isMobile ? '95%' : 600}
          okText={modalType === 'create' ? 'Create' : 'Update'}
          okButtonProps={{ style: { backgroundColor: '#00BF96', borderColor: '#00BF96' } }}
          centered
          style={{ top: isMobile ? 20 : 100 }}
        >
          <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
            <Form.Item
              name="name"
              label="Permission Name"
              rules={[{ required: true, message: 'Please enter permission name' }]}
            >
              <Input placeholder="e.g., User Management - Create" size={isMobile ? 'middle' : 'large'} />
            </Form.Item>

            <Row gutter={isMobile ? 0 : 16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="module"
                  label="Module"
                  rules={[{ required: true, message: 'Please select module' }]}
                >
                  <Select placeholder="Select module" size={isMobile ? 'middle' : 'large'}>
                    {modules.map(module => (
                      <Option key={module._id} value={module._id}>
                        {module.displayName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="action"
                  label="Action"
                  rules={[{ required: true, message: 'Please select action' }]}
                >
                  <Select placeholder="Select action" size={isMobile ? 'middle' : 'large'}>
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
                rows={isMobile ? 2 : 3}
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

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
  Tooltip,
  App
} from 'antd';
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { getModules, createModule, updateModule, deleteModule } from '../../api/moduleService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ModuleManagement = () => {
  const { message } = App.useApp();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedModule, setSelectedModule] = useState(null);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} modules`
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

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await getModules();
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      message.error('Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const showCreateModal = () => {
    setModalType('create');
    setSelectedModule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (module) => {
    setModalType('edit');
    setSelectedModule(module);
    form.setFieldsValue({
      name: module.name,
      displayName: module.displayName,
      description: module.description
    });
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const moduleData = {
        name: values.name,
        displayName: values.displayName,
        description: values.description
      };

      if (modalType === 'create') {
        await createModule(moduleData);
        message.success('Module created successfully');
      } else {
        await updateModule(selectedModule._id, moduleData);
        message.success('Module updated successfully');
      }

      setModalVisible(false);
      fetchModules();
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
          friendlyMessage = 'Module name must contain only letters and underscores (e.g., user_management, file_management)';
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
      await deleteModule(id);
      message.success('Module deleted successfully');
      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      message.error(error.message || 'Failed to delete module');
    }
  };

  // Simplified columns configuration
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Module Name',
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
              <AppstoreOutlined style={{
                marginRight: '8px',
                color: '#00BF96',
                fontSize: isMobile ? '14px' : '16px'
              }} />
              <span style={{
                fontSize: isMobile ? '14px' : '16px'
              }}>
                {text}
              </span>
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
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (text) => (
          <div style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#595959'
          }}>
            {text || 'No description'}
          </div>
        ),
        ellipsis: true
      },
      {
        title: 'Actions',
        key: 'actions',
        width: isMobile ? '120px' : '150px',
        render: (_, record) => (
          <Space direction={isMobile ? 'vertical' : 'horizontal'} size={isMobile ? 'small' : 'middle'}>
            <Tooltip title="Edit Module">
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
            <Tooltip title="Delete Module">
              <Popconfirm
                title="Are you sure you want to delete this module?"
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
      }
    ];

    return baseColumns;
  };

  const columns = getColumns();

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
            <AppstoreOutlined style={{
              marginRight: '12px',
              color: '#00BF96',
              fontSize: isMobile ? '18px' : '20px'
            }} />
            Module Management
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? '14px' : '16px' }}>
            Manage system modules and their configurations
          </Text>
        </div>


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
            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>Modules</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              style={{ backgroundColor: '#00BF96', borderColor: '#00BF96' }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Add' : 'Add Module'}
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={modules}
            rowKey="_id"
            loading={loading}
            scroll={{ x: isMobile ? 600 : undefined }}
            pagination={{
              ...pagination,
              pageSize: isMobile ? 5 : pagination.pageSize,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: (total, range) =>
                isMobile ? `${total} modules` : `${range[0]}-${range[1]} of ${total} modules`,
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

        {/* Module Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <AppstoreOutlined style={{
                marginRight: '8px',
                color: '#00BF96',
                fontSize: isMobile ? '16px' : '18px'
              }} />
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                {modalType === 'create' ? 'Create New Module' : 'Edit Module'}
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
            <Form.Item
              name="name"
              label="Module Name"
              rules={[
                { required: true, message: 'Please enter module name' },
                {
                  pattern: /^[a-zA-Z_]+$/,
                  message: 'Module name must contain only letters and underscores (e.g., user_management, file_management)'
                },
                { min: 2, message: 'Module name must be at least 2 characters long' },
                { max: 50, message: 'Module name cannot exceed 50 characters' }
              ]}
            >
              <Input
                placeholder="e.g., user_management, file_management"
                size={isMobile ? 'middle' : 'large'}
              />
            </Form.Item>

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
                placeholder="e.g., User Management, File Management"
                size={isMobile ? 'middle' : 'large'}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                { max: 500, message: 'Description cannot exceed 500 characters' }
              ]}
            >
              <TextArea
                rows={isMobile ? 3 : 4}
                placeholder="Describe the module and its purpose"
                size={isMobile ? 'middle' : 'large'}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Sidebar>
  );
};

export default ModuleManagement;
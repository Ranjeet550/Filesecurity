import { acceptFile } from '../../api/fileService';
import { useState, useContext, useMemo } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Popconfirm,
  Card,
  App,
  Modal,
  Form,
  Input,
  Alert,
  Divider,
  Spin,
  Result,
  Progress,
  Tag,
  Row,
  Col,
  theme,
  Select
} from 'antd';
import {
  FileOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileZipOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  LockOutlined,
  SecurityScanOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { deleteFile, getFileById, downloadFile, assignFileToUsers } from '../../api/fileService';
import { getUsers } from '../../api/userService';

import AuthContext from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';


const { Text } = Typography;
const { useToken } = theme;

// Helper function to get file icon based on mimetype
const getFileIcon = (mimetype) => {
  if (mimetype?.includes('zip') || mimetype?.includes('compressed')) {
    return <FileZipOutlined style={{ color: '#faad14' }} />;
  } else if (mimetype?.includes('pdf')) {
    return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  } else if (mimetype?.includes('image')) {
    return <FileImageOutlined style={{ color: '#1890ff' }} />;
  } else {
    return <FileTextOutlined style={{ color: '#52c41a' }} />;
  }
};

const FilesTable = ({ files, loading, fetchFiles, activeView, isAdmin }) => {
  // Accept all pending files for viewer
  const [accepting, setAccepting] = useState(false);
  const handleAcceptAll = async () => {
    setAccepting(true);
    try {
      // Accept all files assigned to this user and still pending
      const pendingFiles = files.filter(f => f.status !== 'Accepted' && Array.isArray(f.assignedTo) && f.assignedTo.includes(user._id));
      await Promise.all(pendingFiles.map(f => acceptFile(f._id || f.id)));
      message.success('All files accepted!');
      fetchFiles();
    } catch (err) {
      message.error('Failed to accept all files');
    } finally {
      setAccepting(false);
    }
  };
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { token } = useToken();

  // Assign modal state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm] = Form.useForm();
  const [assignFile, setAssignFile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [assignError, setAssignError] = useState(null);

  // Fetch all users for assignment (admin only)
  const fetchAllUsers = async () => {
    try {
      const usersResponse = await getUsers();
      // If response has .data, use it, else fallback to array or empty
      setAllUsers(Array.isArray(usersResponse?.data) ? usersResponse.data : (Array.isArray(usersResponse) ? usersResponse : []));
    } catch (error) {
      setAllUsers([]);
    }
  };

  // Open assign modal
  const handleOpenAssign = async (file) => {
    setAssignFile(file);
    setAssignError(null);
    setAssignModalVisible(true);
    assignForm.resetFields();
    await fetchAllUsers();
  };

  // Assign file to users
  const handleAssign = async (values) => {
    setAssignLoading(true);
    setAssignError(null);
    try {
      await assignFileToUsers(assignFile.id || assignFile._id, values.userIds);
      setAssignModalVisible(false);
      message.success('File assigned to users');
      fetchFiles();
    } catch (error) {
      setAssignError(error.message || 'Failed to assign file');
    } finally {
      setAssignLoading(false);
    }
  };

  // Close assign modal
  const closeAssignModal = () => {
    setAssignModalVisible(false);
    setAssignFile(null);
    setAssignError(null);
    assignForm.resetFields();
  };

  // Table styles
  const tableStyles = {
    table: {
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
    headerCell: {
      background: token.colorBgContainer,
      fontWeight: 700,
      color: token.colorTextHeading,
      padding: '16px',
      borderBottom: `2px solid ${token.colorBorderSecondary}`,
    },
    bodyCell: {
      padding: '16px',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
    },
    hoverRow: {
      background: token.colorBgTextHover,
    },
    lastRow: {
      borderBottom: 'none',
    },
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    // Apply search first
    const listBySearch = (() => {
      if (!searchTerm.trim()) return files;
      const searchLower = searchTerm.toLowerCase();
      return files.filter(file => {
        const fileName = (file.originalName || '').toLowerCase();
        const uploadedByName = isAdmin && file.uploadedBy?.name
          ? file.uploadedBy.name.toLowerCase()
          : '';
        const fileExtension = fileName.split('.').pop() || '';
        return (
          fileName.includes(searchLower) ||
          uploadedByName.includes(searchLower) ||
          fileExtension.includes(searchLower)
        );
      });
    })();

    // Then apply status filter
    const listByStatus = listBySearch.filter(file => {
      if (statusFilter === 'all') return true;
      const status = (file.status || 'Pending');
      return status.toLowerCase() === statusFilter;
    });

    return listByStatus;
  }, [files, searchTerm, isAdmin, statusFilter]);

  // Download modal state
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadForm] = Form.useForm();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDelete = async (id) => {
    try {
      await deleteFile(id);
      message.success('File deleted successfully');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);

      // Check if it's an authentication error
      if (error.message === 'Not authorized to access this route' ||
          error.message?.includes('authentication') ||
          error.message?.includes('token')) {
        message.error('Your session has expired. Please log in again.');
        // Log the user out and redirect to login
        logout();
        navigate('/login');
      } else {
        message.error('Failed to delete file');
      }
    }
  };

  // Handle opening download modal
  const handleDownloadClick = async (record) => {
    try {
      setDownloadLoading(true);
      setDownloadError(null);
      setDownloadSuccess(false);
      setDownloadProgress(0);

      // Fetch file details
      const response = await getFileById(record.id || record._id);
      setSelectedFile(response.data);
      setDownloadModalVisible(true);
    } catch (error) {
      console.error('Error fetching file details:', error);
      message.error('Failed to load file details');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Handle download in modal
  const handleModalDownload = async (values) => {
    try {
      setDownloading(true);
      setDownloadError(null);

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 99) {
            clearInterval(progressInterval);
            return 99;
          }
          return prev + Math.floor(Math.random() * 10);
        });
      }, 300);

      // Perform the download
      const result = await downloadFile(selectedFile.id || selectedFile._id, values.password);
      console.log('Download completed successfully:', result);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Show success state
      setTimeout(() => {
        setDownloadSuccess(true);
        // Refresh the files list to update download counts
        fetchFiles();
      }, 500);

    } catch (error) {
      console.error('Download error:', error);
      setDownloadError('Invalid password or file not available');
      setDownloadProgress(0);
    } finally {
      setDownloading(false);
    }
  };

  // Close download modal
  const closeDownloadModal = () => {
    setDownloadModalVisible(false);
    setSelectedFile(null);
    setDownloadError(null);
    setDownloadSuccess(false);
    setDownloadProgress(0);
    downloadForm.resetFields();
  };

  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const columns = [
    // ...existing code...
   
    {
      title: 'SN.',
      key: 'serialNumber',
      render: (_, __, index) => {
        return (currentPage - 1) * pageSize + index + 1;
      },
      width: '80px',
      fixed: 'left',
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
    {
      title: 'File Name',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.mimetype)}
          <span style={{ fontWeight: '500' }}>{text}</span>
        </Space>
      ),
      ellipsis: true,
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatBytes(size),
      width: '100px',
      responsive: ['sm'],
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
    {
      title: 'Send Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
      width: '120px',
      responsive: ['md'],
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
    {
      title: 'Downloads',
      dataIndex: 'downloads',
      key: 'downloads',
      render: (downloads) => {
        const downloadCount = downloads && Array.isArray(downloads) ? downloads.length : 0;
        return (
          <Space>
            <DownloadOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: '500' }}>{downloadCount}</span>
          </Space>
        );
      },
      width: '100px',
      responsive: ['md'],
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
    // Always show "Uploaded By" column
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      render: (uploadedBy) => (
        <Space>
          <UserOutlined style={{ color: '#722ed1' }} />
          <Tag color="purple">
            {uploadedBy?.name || 'Unknown User'}
          </Tag>
        </Space>
      ),
      width: '150px',
      responsive: ['lg'],
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
     {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Accepted' ? 'green' : 'orange'} style={{ fontWeight: 500 }}>
          {status || 'Pending'}
        </Tag>
      ),
      width: '110px',
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        // Check if user has delete permission
        const canDelete = hasPermission(user, 'file_management', 'delete');
        const canAssign = isAdmin;

        // Only show Share button if user is not a viewer
        const isViewer = user?.role?.name === 'viewer';
        return (
          <Space size="small" wrap>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="small"
              className="gradient-button"
              onClick={() => handleDownloadClick(record)}
              loading={downloadLoading && selectedFile?.id === (record.id || record._id)}
            >
              <span className="action-text">Download</span>
            </Button>
            {!isViewer && (
              <Button
                type="default"
                icon={<ShareAltOutlined />}
                size="small"
                onClick={async () => {
                  try {
                    const fileId = record.id || record._id;
                    const link = `${window.location.origin}/download/${fileId}`;
                    navigator.clipboard.writeText(link);
                    message.success('Download link copied to clipboard');
                  } catch (error) {
                    console.error('Error sharing file:', error);
                    message.error('Failed to share file');
                  }
                }}
              >
                <span className="action-text">Share</span>
              </Button>
            )}
            {canAssign && (
              <Button
                type="dashed"
                icon={<UserOutlined />}
                size="small"
                onClick={() => handleOpenAssign(record)}
              >
                Assign
              </Button>
            )}
            {isViewer && record.status !== 'Accepted' && (
              <>
                {console.log('DEBUG Accept btn:', { userId: user._id, assignedTo: record.assignedTo })}
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  loading={accepting}
                  onClick={async () => {
                    setAccepting(true);
                    try {
                      await acceptFile(record._id || record.id);
                      message.success('File accepted!');
                      fetchFiles();
                    } catch (err) {
                      message.error('Failed to accept file');
                    } finally {
                      setAccepting(false);
                    }
                  }}
                >
                  Accept
                </Button>
              </>
            )}
            {canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this file?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record.id || record._id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            )}
          </Space>
        );
      },
      width: '250px',
      onHeaderCell: () => ({
        style: tableStyles.headerCell,
      }),
      onCell: () => ({
        style: tableStyles.bodyCell,
      }),
    },
  ];

  // Responsive styles
  const responsiveStyles = {
    
    header: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '10px 15px',
      borderBottom: '1px solid #f0f0f0'
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    searchContainer: {
      padding: '16px 20px',
      borderBottom: '1px solid #f0f0f0'
    },
    actionButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap'
    },
    uploadButton: {
      background: 'linear-gradient(90deg, #00BF96 0%, #00A080 100%)',
      border: 'none',
      boxShadow: '0 2px 8px rgba(0, 191, 150, 0.2)',
      borderRadius: '8px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      whiteSpace: 'nowrap'
    }
  };

  return (
    <>
      
      
      
        <div style={responsiveStyles.header}>
          {/* Accept All button for viewer users */}
          {user?.role?.name === 'viewer' && files.some(f => f.status !== 'Accepted' && Array.isArray(f.assignedTo) && f.assignedTo.includes(user._id)) && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={accepting}
              style={{ marginBottom: 16, marginRight: 16 }}
              onClick={handleAcceptAll}
            >
              Accept All Pending Files
            </Button>
          )}
          <div style={responsiveStyles.title}>
            {activeView === 'all-files' ? (
              <AppstoreOutlined style={{ fontSize: '18px', color: '#00BF96' }} />
            ) : (
              <FileOutlined style={{ fontSize: '18px', color: '#00BF96' }} />
            )}
            <Typography.Text strong style={{ color: '#1a2141' }}>
              {activeView === 'all-files' ? 'All Files' : 'Your Files'}
            </Typography.Text>
          </div>
          
          {hasPermission(user, 'file_management', 'create') && (
            <Link to="/upload">
              <Button style={responsiveStyles.uploadButton}>
                <UploadOutlined />
                <span style={{ marginLeft: '8px' }}>Upload New File</span>
              </Button>
            </Link>
          )}
        </div>

        <div style={responsiveStyles.searchContainer}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={8} xl={6}>
              <Input
                placeholder="Search files by name, type, or uploader..."
                prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                suffix={
                  searchTerm ? (
                    <ClearOutlined
                      style={{ color: '#8c8c8c', cursor: 'pointer' }}
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                    />
                  ) : null
                }
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
                style={{
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={8} xl={6}>
              <Select
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                style={{ width: '50%' }}
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="accepted">Accepted</Select.Option>
              </Select>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredFiles}
          loading={loading}
          rowKey={(record) => record.id || record._id}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            responsive: true,
            size: 'small'
          }}
          scroll={{ x: 'max-content' }}
          style={{
            ...tableStyles.table,
            overflowX: 'auto'
          }}
          onRow={(record, index) => ({
            style: {
              ...tableStyles.bodyCell,
              ...(index === filteredFiles.length - 1 ? tableStyles.lastRow : {}),
            },
            onMouseEnter: (event) => {
              event.currentTarget.style.background = tableStyles.hoverRow.background;
            },
            onMouseLeave: (event) => {
              event.currentTarget.style.background = '';
            },
          })}
        />
    

      {/* Assign Modal (Admin Only) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <UserOutlined style={{ marginRight: '6px', color: '#00BF96', fontSize: '16px' }} />
            Assign File to Users
          </div>
        }
        open={assignModalVisible}
        onCancel={closeAssignModal}
        footer={null}
        width={400}
        style={{ top: 20 }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          form={assignForm}
          name="assign"
          onFinish={handleAssign}
          layout="vertical"
          size="small"
        >
          <Form.Item
            name="userIds"
            label={<span style={{ fontSize: '13px', fontWeight: '500' }}>Select Users</span>}
            rules={[{ required: true, message: 'Please select at least one user!' }]}
            style={{ marginBottom: '16px' }}
          >
            <Select
              mode="multiple"
              placeholder="Select users to assign"
              style={{ width: '100%' }}
              loading={allUsers.length === 0}
              optionFilterProp="children"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {allUsers
                .filter(u => u._id !== assignFile?.uploadedBy?._id && u._id !== assignFile?.uploadedBy)
                .map(user => (
                  <Select.Option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          {assignError && (
            <Alert
              message="Assign Error"
              description={assignError}
              type="error"
              showIcon
              closable
              onClose={() => setAssignError(null)}
              style={{ marginBottom: 16, fontSize: '13px' }}
              size="small"
            />
          )}
          <Form.Item style={{ marginBottom: 0 }}>
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Button onClick={closeAssignModal} size="small">
                  Cancel
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={assignLoading}
                  className="gradient-button"
                  size="small"
                >
                  Assign
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      {/* Download Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <SecurityScanOutlined style={{ marginRight: '6px', color: '#00BF96', fontSize: '16px' }} />
            Secure File Download
          </div>
        }
        open={downloadModalVisible}
        onCancel={closeDownloadModal}
        footer={null}
        width={450}
        style={{ top: 20 }}
        bodyStyle={{ padding: '24px' }}
      >
        {downloadLoading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Spin size="default" />
            <div style={{ marginTop: '12px', fontSize: '14px' }}>Loading file information...</div>
          </div>
        ) : selectedFile ? (
          <>
            {downloadSuccess ? (
              <Result
                status="success"
                title="File Downloaded Successfully!"
                subTitle="Your file has been downloaded securely."
                icon={<CheckCircleOutlined style={{ color: '#00BF96' }} />}
                extra={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Row gutter={[16, 16]} justify="center">
                      <Col>
                        <Button
                          type="primary"
                          className="gradient-button"
                          onClick={closeDownloadModal}
                        >
                          Close
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => {
                            setDownloadSuccess(false);
                            setDownloadProgress(0);
                          }}
                          icon={<DownloadOutlined />}
                        >
                          Download Again
                        </Button>
                      </Col>
                    </Row>
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Text type="secondary">
                        Check your downloads folder for the file. The file will open in your browser for viewing only.
                      </Text>
                    </div>
                  </Space>
                }
              />
            ) : (
              <>
                <Card
                  style={{
                    marginBottom: 16,
                    borderRadius: '6px',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
                  }}
                  size="small"
                >
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={24} md={24}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            background: '#f0f7ff',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                          }}>
                            {getFileIcon(selectedFile.mimetype)}
                          </div>
                          <div>
                            <Text strong style={{ fontSize: 14, display: 'block' }}>
                              {selectedFile.filename || selectedFile.originalName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Size: {formatBytes(selectedFile.size)}
                            </Text>
                          </div>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#fff7e6',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #ffe7ba'
                        }}>
                          <FileProtectOutlined style={{ color: '#fa8c16', fontSize: '16px', marginRight: '8px' }} />
                          <div>
                            <Text strong style={{ color: '#d46b08', fontSize: '13px' }}>Password Protected File</Text>
                            <div>
                              <Text type="warning" style={{ fontSize: '12px' }}>
                                Enter the password to download this file securely.
                              </Text>
                            </div>
                          </div>
                        </div>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                {downloadError && (
                  <Alert
                    message="Download Error"
                    description={downloadError}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setDownloadError(null)}
                    style={{ marginBottom: 16, fontSize: '13px' }}
                    size="small"
                  />
                )}

                <Form
                  form={downloadForm}
                  name="download"
                  onFinish={handleModalDownload}
                  layout="vertical"
                  size="small"
                >
                  <Form.Item
                    name="password"
                    label={<span style={{ fontSize: '13px', fontWeight: '500' }}>File Password:</span>}
                    rules={[{ required: true, message: 'Please enter the file password!' }]}
                    style={{ marginBottom: '16px' }}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#00BF96', fontSize: '15px' }} />}
                      placeholder="Enter password"
                      autoComplete="off"
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Item>

                  {downloading && (
                    <div style={{ marginBottom: '16px' }}>
                      <Progress
                        percent={downloadProgress}
                        status={downloadProgress >= 100 ? "success" : "active"}
                        strokeColor={{
                          '0%': '#00BF96',
                          '100%': '#00A080',
                        }}
                        size="small"
                      />
                      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: '6px', fontSize: '12px' }}>
                        {downloadProgress < 100 ? 'Downloading file...' : 'Download complete!'}
                      </Text>
                    </div>
                  )}

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Row gutter={[16, 16]} justify="end">
                      <Col>
                        <Button onClick={closeDownloadModal} size="small">
                          Cancel
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<DownloadOutlined />}
                          loading={downloading}
                          className="gradient-button"
                          size="small"
                        >
                          Download
                        </Button>
                      </Col>
                    </Row>
                  </Form.Item>
                </Form>
              </>
            )}
          </>
        ) : (
          <Result
            status="error"
            title="File Not Found"
            subTitle="The file you are looking for does not exist or has expired."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          />
        )}
      </Modal>
    </>
  );
};

export default FilesTable;

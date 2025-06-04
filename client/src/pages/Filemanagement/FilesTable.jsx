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
  Col
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
import { deleteFile, getFileById, downloadFile } from '../../api/fileService';
import AuthContext from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';

const { Text } = Typography;

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
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { message } = App.useApp();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) {
      return files;
    }

    const searchLower = searchTerm.toLowerCase();
    return files.filter(file => {
      // Search in file name
      const fileName = (file.originalName || '').toLowerCase();

      // Search in uploaded by user name (for admin view)
      const uploadedByName = isAdmin && file.uploadedBy?.name
        ? file.uploadedBy.name.toLowerCase()
        : '';

      // Search in file extension/type
      const fileExtension = fileName.split('.').pop() || '';

      return fileName.includes(searchLower) ||
             uploadedByName.includes(searchLower) ||
             fileExtension.includes(searchLower);
    });
  }, [files, searchTerm, isAdmin]);

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
    {
      title: 'SN.',
      key: 'serialNumber',
      render: (_, __, index) => {
        // Calculate the serial number based on current page and page size
        return (currentPage - 1) * pageSize + index + 1;
      },
      width: '8%',
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
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatBytes(size),
      width: '12%',
    },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
      width: '15%',
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
      width: '15%',
    },
    // Conditionally add "Uploaded By" column for admin users
    ...(isAdmin ? [{
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
      width: '15%',
    }] : []),
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        // Check if user has delete permission
        const canDelete = hasPermission(user, 'file_management', 'delete');

        return (
          <Space size="small">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="small"
              className="gradient-button"
              onClick={() => handleDownloadClick(record)}
              loading={downloadLoading && selectedFile?.id === (record.id || record._id)}
            >
              Download
            </Button>
            <Button
              type="default"
              icon={<ShareAltOutlined />}
              size="small"
              onClick={async () => {
                try {
                  const fileId = record.id || record._id;
                  // Create a link without the password for security
                  const link = `${window.location.origin}/download/${fileId}`;
                  navigator.clipboard.writeText(link);
                  message.success('Download link copied to clipboard');
                } catch (error) {
                  console.error('Error sharing file:', error);
                  message.error('Failed to share file');
                }
              }}
            >
              Share
            </Button>
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
      width: '25%',
    },
  ];

  return (
    <>
      <Card
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            padding: '20px 24px'
          },
          body: {
            padding: '0'
          }
        }}
        style={{
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #f0f0f0',
          overflow: 'hidden'
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {activeView === 'all-files' ? (
              <AppstoreOutlined style={{ marginRight: '8px', fontSize: '18px', color: '#00BF96' }} />
            ) : (
              <FileOutlined style={{ marginRight: '8px', fontSize: '18px', color: '#00BF96' }} />
            )}
            <span style={{ fontWeight: '600', color: '#1a2141' }}>
              {activeView === 'all-files' ? 'All Files' : 'Your Files'}
            </span>
          </div>
        }
        extra={
          hasPermission(user, 'file_management', 'create') && (
            <Link to="/upload">
              <Button
                type="primary"
                icon={<UploadOutlined />}
                style={{
                  background: 'linear-gradient(90deg, #00BF96 0%, #00A080 100%)',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0, 191, 150, 0.2)',
                  borderRadius: '8px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px'
                }}
              >
                Upload New File
              </Button>
            </Link>
          )
        }
      >
        {/* Search Input */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          
        }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={5}>
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
                  setCurrentPage(1); // Reset to first page when searching
                }}
                allowClear
                style={{
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </Col>
         
          </Row>
        </div>

        <Table
          style={{
            '& .ant-table-thead > tr > th': {
              background: 'rgba(0, 0, 0, 0.02)',
              fontWeight: '600',
              color: '#1a2141'
            },
            '& .ant-table-tbody > tr:hover > td': {
              background: 'rgba(0, 191, 150, 0.05)'
            }
          }}
          columns={columns}
          dataSource={filteredFiles}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showTotal: (total) => searchTerm
              ? `Showing ${total} of ${files.length} files`
              : `Total ${total} files`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            onShowSizeChange: (_, size) => {
              setCurrentPage(1); // Reset to first page when changing page size
              setPageSize(size);
            }
          }}
        />
      </Card>

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
                    <Space>
                      <Button
                        type="primary"
                        className="gradient-button"
                        onClick={closeDownloadModal}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          setDownloadSuccess(false);
                          setDownloadProgress(0);
                        }}
                        icon={<DownloadOutlined />}
                      >
                        Download Again
                      </Button>
                    </Space>
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
                      style={{ fontSize: '13px', width: '50%' }}
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
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }} size="small">
                      <Button onClick={closeDownloadModal} size="small">
                        Cancel
                      </Button>
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
                    </Space>
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

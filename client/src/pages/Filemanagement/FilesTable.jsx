import { acceptFile, unassignFileFromUser } from '../../api/fileService';
import { useState, useContext, useMemo, useEffect } from 'react';
import { useTableSort, SortableHeader } from '../../components/Tablesort';
import { getDownloadLimit } from '../../api/settingsService';
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
  Select,
  DatePicker
} from 'antd';
import {
  InfoCircleOutlined,
  TeamOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { Checkbox } from 'antd';
import dayjs from 'dayjs';
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
  ClearOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { deleteFile, getFileById, downloadFile, assignFileToUsers, updateFileTiming } from '../../api/fileService';
import { getUsers } from '../../api/userService';

import AuthContext from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { exportFilesToExcel } from '../../utils/exportToExcel';


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

const FilesTable = ({ files, loading, fetchFiles, activeView, isAdmin, hiddenFileIds: propHiddenFileIds, setHiddenFileIds: propSetHiddenFileIds }) => {
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
      setSelectedFiles([]); // Clear selections after accepting all
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

  // Define isViewer early so it can be used in useEffect
  const isViewer = user?.role?.name === 'viewer';

  // Download limit state
  const [downloadLimit, setDownloadLimit] = useState(1);

  // Use props if provided, otherwise use local state (for standalone usage)
  const [localHiddenFileIds, setLocalHiddenFileIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`hiddenFiles_${user?._id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const hiddenFileIds = propHiddenFileIds !== undefined ? propHiddenFileIds : localHiddenFileIds;
  const setHiddenFileIds = propSetHiddenFileIds || setLocalHiddenFileIds;

  // Assign modal state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm] = Form.useForm();
  const [assignFile, setAssignFile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  // For mapping userId to user object (for assignedTo display)
  const [userMap, setUserMap] = useState({});
  const [assignError, setAssignError] = useState(null);

  // Edit timing modal state
   const [timingModalVisible, setTimingModalVisible] = useState(false);
   const [timingLoading, setTimingLoading] = useState(false);
   const [timingForm] = Form.useForm();
   const [timingFile, setTimingFile] = useState(null);
   const [timingError, setTimingError] = useState(null);

   // Bulk timing modal state
   const [bulkTimingModalVisible, setBulkTimingModalVisible] = useState(false);
   const [bulkTimingLoading, setBulkTimingLoading] = useState(false);
   const [bulkTimingForm] = Form.useForm();
   const [selectedFiles, setSelectedFiles] = useState([]);
   const [bulkTimingError, setBulkTimingError] = useState(null);

   // Bulk accept modal state (for viewers)
   const [bulkAcceptLoading, setBulkAcceptLoading] = useState(false);

  // Fetch all users for assignment (admin only) and for assignedTo display
  const fetchAllUsers = async () => {
    try {
      const usersResponse = await getUsers();
      const usersArr = Array.isArray(usersResponse?.data) ? usersResponse.data : (Array.isArray(usersResponse) ? usersResponse : []);
      setAllUsers(usersArr);
      // Build userId -> user object map
      const map = {};
      usersArr.forEach(u => { if(u && u._id) map[u._id] = u; });
      setUserMap(map);
    } catch (error) {
      setAllUsers([]);
      setUserMap({});
    }
  };

  // Get unique groups from users for filtering
  const getAvailableGroups = () => {
    const userGroups = allUsers.map(user => user.group).filter(group => group);
    const fileGroups = files.map(file => file.group).filter(group => group);
    return [...new Set([...userGroups, ...fileGroups])];
  };

  // Open assign modal
  const handleOpenAssign = async (file) => {
    setAssignFile(file);
    setAssignError(null);
    setAssignModalVisible(true);
    assignForm.resetFields();
    // Always fetch users for modal, but also fetch on mount for assignedTo column
    await fetchAllUsers();
  };
  // Fetch all users on mount for assignedTo column
  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line
  }, []);

  // Fetch download limit on mount
  useEffect(() => {
    const fetchDownloadLimit = async () => {
      try {
        const response = await getDownloadLimit();
        setDownloadLimit(response.data?.value || 1);
      } catch (error) {
        console.error('Error fetching download limit:', error);
        setDownloadLimit(1); // Default fallback
      }
    };

    fetchDownloadLimit();

    // Listen for settings updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.type === 'downloadLimit') {
        setDownloadLimit(event.detail.value);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Auto-refresh files every 30 seconds for viewers to see updates
  useEffect(() => {
    if (isViewer) {
      const interval = setInterval(() => {
        fetchFiles();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isViewer, fetchFiles]);

  // Assign file to users
  const handleAssign = async (values) => {
    setAssignLoading(true);
    setAssignError(null);
    try {
      // Handle multiple user IDs
      const userIds = Array.isArray(values.userIds) ? values.userIds : [values.userIds];
      await assignFileToUsers(assignFile.id || assignFile._id, userIds);
      setAssignModalVisible(false);
      const userCount = userIds.length;
      message.success(`File assigned to ${userCount} user${userCount > 1 ? 's' : ''}`);
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

  // Open timing modal
  const handleOpenTiming = (file) => {
    setTimingFile(file);
    setTimingError(null);
    setTimingModalVisible(true);
    timingForm.setFieldsValue({
      startTime: file.startTime ? dayjs(file.startTime) : null,
      endTime: file.endTime ? dayjs(file.endTime) : null
    });
  };

  // Update file timing
  const handleUpdateTiming = async (values) => {
    setTimingLoading(true);
    setTimingError(null);
    try {
      // Validate required timing fields
      if (!values.startTime || !values.endTime) {
        setTimingError('Both start time and end time are required');
        setTimingLoading(false);
        return;
      }

      const timingData = {
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString()
      };
      await updateFileTiming(timingFile.id || timingFile._id, timingData);
      setTimingModalVisible(false);
      message.success('File timing updated successfully');
      fetchFiles();
    } catch (error) {
      setTimingError(error.message || 'Failed to update file timing');
    } finally {
      setTimingLoading(false);
    }
  };

  // Close timing modal
   const closeTimingModal = () => {
     setTimingModalVisible(false);
     setTimingFile(null);
     setTimingError(null);
     timingForm.resetFields();
   };

   // Open bulk timing modal
   const handleOpenBulkTiming = () => {
     if (selectedFiles.length === 0) {
       message.warning('Please select files to update timing');
       return;
     }
     setBulkTimingError(null);
     setBulkTimingModalVisible(true);
     bulkTimingForm.resetFields();
   };

   // Bulk update file timing
   const handleBulkUpdateTiming = async (values) => {
     setBulkTimingLoading(true);
     setBulkTimingError(null);
     try {
       // Validate required timing fields
       if (!values.startTime || !values.endTime) {
         setBulkTimingError('Both start time and end time are required');
         setBulkTimingLoading(false);
         return;
       }

       const timingData = {
         startTime: values.startTime.toISOString(),
         endTime: values.endTime.toISOString()
       };

       // Update timing for all selected files
       await Promise.all(selectedFiles.map(fileId =>
         updateFileTiming(fileId, timingData)
       ));

       setBulkTimingModalVisible(false);
       setSelectedFiles([]);
       message.success(`Timing updated for ${selectedFiles.length} file(s)`);
       fetchFiles();
     } catch (error) {
       setBulkTimingError(error.message || 'Failed to update file timing');
     } finally {
       setBulkTimingLoading(false);
     }
   };

   // Close bulk timing modal
   const closeBulkTimingModal = () => {
     setBulkTimingModalVisible(false);
     setSelectedFiles([]);
     setBulkTimingError(null);
     bulkTimingForm.resetFields();
   };

   // Bulk accept files (for viewers)
   const handleBulkAccept = async () => {
     if (selectedFiles.length === 0) {
       message.warning('Please select files to accept');
       return;
     }
     setBulkAcceptLoading(true);
     try {
       // Accept all selected files
       await Promise.all(selectedFiles.map(fileId => acceptFile(fileId)));
       message.success(`Accepted ${selectedFiles.length} file(s)`);
       fetchFiles();
       setSelectedFiles([]); // Clear selections after bulk accept
     } catch (error) {
       message.error('Failed to accept selected files');
     } finally {
       setBulkAcceptLoading(false);
     }
   };

   // Handle file selection
   const handleFileSelect = (fileId, checked) => {
     if (checked) {
       setSelectedFiles(prev => [...prev, fileId]);
     } else {
       setSelectedFiles(prev => prev.filter(id => id !== fileId));
     }
   };

   // Handle select all
   const handleSelectAll = (checked) => {
     if (checked) {
       const userId = user?._id || user?.id;
       const selectableFiles = sortedData.filter(file => {
         if (isAdmin) return true;
         if (isViewer) return file.status !== 'Accepted' && Array.isArray(file.assignedTo) && file.assignedTo.includes(userId);
         return false;
       }).map(file => file.id || file._id);
       setSelectedFiles(selectableFiles);
     } else {
       setSelectedFiles([]);
     }
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
  const [groupFilter, setGroupFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting configuration for different columns
  const sortConfig = useMemo(() => ({
    originalName: (a, b) => (a.originalName || '').localeCompare(b.originalName || ''),
    size: (a, b) => (a.size || 0) - (b.size || 0),
    createdAt: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    downloads: (a, b) => {
      // Get user ID - try both _id and id properties
      const userId = user?._id || user?.id;
      
      let aCount, bCount;
      
      if (isAdmin) {
        // Admin sorts by total downloads
        aCount = Array.isArray(a.downloads) ? a.downloads.length : 0;
        bCount = Array.isArray(b.downloads) ? b.downloads.length : 0;
      } else {
        // Viewer sorts by their own download status (0 or 1)
        aCount = userId && Array.isArray(a.downloads) && a.downloads.some(d => {
          const dUserId = typeof d.user === 'string' ? d.user : (d.user?._id || d.user);
          return dUserId && dUserId.toString() === userId.toString();
        }) ? 1 : 0;
        
        bCount = userId && Array.isArray(b.downloads) && b.downloads.some(d => {
          const dUserId = typeof d.user === 'string' ? d.user : (d.user?._id || d.user);
          return dUserId && dUserId.toString() === userId.toString();
        }) ? 1 : 0;
      }
      
      return aCount - bCount;
    },
    'uploadedBy.name': (a, b) => {
      const aName = a.uploadedBy?.name || '';
      const bName = b.uploadedBy?.name || '';
      return aName.localeCompare(bName);
    },
    status: (a, b) => (a.status || 'Pending').localeCompare(b.status || 'Pending'),
    QPdetails: (a, b) => (a.QPdetails || '').localeCompare(b.QPdetails || ''),
    Subcourse: (a, b) => (a.Subcourse || '').localeCompare(b.Subcourse || ''),
    subject: (a, b) => (a.subject || '').localeCompare(b.subject || ''),
    session: (a, b) => (a.session || '').localeCompare(b.session || ''),
    semyear: (a, b) => (a.semyear || '').localeCompare(b.semyear || ''),
    group: (a, b) => (a.group || '').localeCompare(b.group || ''),
    remark: (a, b) => (a.remark || '').localeCompare(b.remark || ''),
    startTime: (a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return new Date(a.startTime) - new Date(b.startTime);
    },
    endTime: (a, b) => {
      if (!a.endTime && !b.endTime) return 0;
      if (!a.endTime) return 1;
      if (!b.endTime) return -1;
      return new Date(a.endTime) - new Date(b.endTime);
    },
  }), []);

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
        const qpDetails = (file.QPdetails || '').toLowerCase();
        const subcourse = (file.Subcourse || '').toLowerCase();
        const subject = (file.subject || '').toLowerCase();
        const session = (file.session || '').toLowerCase();
        const semyear = (file.semyear || '').toLowerCase();
        const group = (file.group || '').toLowerCase();
        const remark = (file.remark || '').toLowerCase();
        return (
          fileName.includes(searchLower) ||
          uploadedByName.includes(searchLower) ||
          fileExtension.includes(searchLower) ||
          qpDetails.includes(searchLower) ||
          subcourse.includes(searchLower) ||
          subject.includes(searchLower) ||
          session.includes(searchLower) ||
          semyear.includes(searchLower) ||
          group.includes(searchLower) ||
          remark.includes(searchLower)
        );
      });
    })();

    // Then apply status filter
    const listByStatus = listBySearch.filter(file => {
      if (statusFilter === 'all') return true;
      const status = (file.status || 'Pending');
      return status.toLowerCase() === statusFilter;
    });

    // Then apply group filter (admin only)
    const listByGroup = listByStatus.filter(file => {
      if (!isAdmin || groupFilter === 'all') return true;
      const fileGroup = (file.group || '');
      return fileGroup.toLowerCase() === groupFilter.toLowerCase();
    });

    // Filter out files hidden by user (admin/owner deleted but kept for viewers)
    // Only apply this filter for non-viewer users (admin and owners can hide files)
    const listWithoutHidden = !isViewer ? listByGroup.filter(file => {
      const fileId = file.id || file._id;
      return !hiddenFileIds.includes(fileId);
    }) : listByGroup;

    return listWithoutHidden;
  }, [files, searchTerm, isAdmin, statusFilter, groupFilter, hiddenFileIds, isViewer]);

  // Apply sorting to filtered files
  const { sortedData, requestSort, getSortIcon, resetSort, setSearchTerm: setColumnSearchTerm, getSearchTerm: getColumnSearchTerm } = useTableSort(filteredFiles, sortConfig);

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
      
      // Hide the file from user's view (but it stays in DB for viewers)
      // This applies to both admin and owner
      const newHiddenIds = [...hiddenFileIds, id];
      setHiddenFileIds(newHiddenIds);
      localStorage.setItem(`hiddenFiles_${user._id}`, JSON.stringify(newHiddenIds));
      message.success('File removed from your view (still available to assigned viewers)');
      
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

      // Perform the download with original filename
      const result = await downloadFile(selectedFile.id || selectedFile._id, values.password, selectedFile.originalName);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Show success state
      setTimeout(() => {
        setDownloadSuccess(true);
        // Refresh the files list to update download counts
        fetchFiles();
        // Close modal after 2 seconds to show success message
        setTimeout(() => {
          closeDownloadModal();
        }, 2000);
      }, 500);

    } catch (error) {
      console.error('Download error:', error);
      // Check if it's a "already downloaded" error
      if (error.message && error.message.includes('already downloaded')) {
        setDownloadError('You have already downloaded this file. Each user can only download once.');
      } else {
        setDownloadError('file download time are not started yet  ');
      }
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
    // Selection checkbox column (admin and viewer)
    ...((isAdmin || isViewer) ? [{
      title: () => {
        const userId = user?._id || user?.id;
        const selectableFiles = sortedData.filter(file => {
          if (isAdmin) return true;
          if (isViewer) return file.status !== 'Accepted' && Array.isArray(file.assignedTo) && file.assignedTo.includes(userId);
          return false;
        });
        const allSelected = selectableFiles.length > 0 && selectableFiles.every(file => selectedFiles.includes(file.id || file._id));
        const someSelected = selectedFiles.length > 0 && selectedFiles.length < selectableFiles.length;
        return (
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAll(!allSelected);
            }}
          />
        );
      },
      key: 'selection',
      width: '60px',
      fixed: 'left',
      render: (_, record) => {
        const fileId = record.id || record._id;
        const userId = user?._id || user?.id;
        const isSelectable = isAdmin || (isViewer && record.status !== 'Accepted' && Array.isArray(record.assignedTo) && record.assignedTo.includes(userId));
        return (
          <Checkbox
            checked={selectedFiles.includes(fileId)}
            disabled={!isSelectable}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelectable) {
                handleFileSelect(fileId, !selectedFiles.includes(fileId));
              }
            }}
          />
        );
      },
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    }] : []),
    {
      title: 'SN.',
      key: 'serialNumber',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      width: '80px',
      fixed: 'left',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="QPdetails"
          label="Catch No"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'QPdetails',
      key: 'QPdetails',
      render: (text) => text || '-',
      ellipsis: true,
      width: '120px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="originalName"
          label="File Name"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.mimetype)}
          <span style={{ fontWeight: '500' }}>{text}</span>
        </Space>
      ),
      ellipsis: true,
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="status"
          label="Status"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Accepted' ? 'green' : 'orange'} style={{ fontWeight: 500 }}>
          {status || 'Pending'}
        </Tag>
      ),
      width: '110px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="Subcourse"
          label="Course"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'Subcourse',
      key: 'Subcourse',
      render: (text) => text || '-',
      ellipsis: true,
      width: '120px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="subject"
          label="Subject"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'subject',
      key: 'subject',
      render: (text) => text || '-',
      ellipsis: true,
      width: '120px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="session"
          label="Session"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'session',
      key: 'session',
      render: (text) => text || '-',
      ellipsis: true,
      width: '100px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="semyear"
          label="Sem/Year"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'semyear',
      key: 'semyear',
      render: (text) => text || '-',
      ellipsis: true,
      width: '100px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="group"
          label="Group"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'group',
      key: 'group',
      render: (text) => text || '-',
      ellipsis: true,
      width: '120px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="remark"
          label="Remark"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'remark',
      key: 'remark',
      render: (text) => text || '-',
      ellipsis: true,
      width: '120px',
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="startTime"
          label="Start Time"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date) => {
        if (!date) return '-';
        const dateStr = dayjs(date).format('DD/MM/YYYY hh:mm:ss A');
        const now = new Date();
        const dateObj = new Date(date);
        let color = 'inherit';
        if (dateObj > now) {
          color = '#1890ff'; // blue for upcoming
        } else {
          color = '#52c41a'; // green for started
        }
        return <span style={{ color }}>{dateStr}</span>;
      },
      ellipsis: true,
      width: '150px',
      responsive: ['md'],
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="endTime"
          label="End Time"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'endTime',
      key: 'endTime',
      render: (date) => {
        if (!date) return '-';
        const dateStr = dayjs(date).format('DD/MM/YYYY hh:mm:ss A');
        const now = new Date();
        const dateObj = new Date(date);
        let color = 'inherit';
        if (dateObj > now) {
          color = '#52c41a'; // green for still available
        } else {
          color = '#ff4d4f'; // red for expired
        }
        return <span style={{ color }}>{dateStr}</span>;
      },
      ellipsis: true,
      width: '150px',
      responsive: ['md'],
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="size"
          label="Size"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatBytes(size),
      width: '100px',
      responsive: ['sm'],
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="createdAt"
          label="Send Date"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          {dayjs(date).format('DD/MM/YYYY')}
        </Space>
      ),
      width: '120px',
      responsive: ['md'],
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="downloads"
          label="Downloads"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'downloads',
      key: 'downloads',
      render: (downloads, record) => {
        // Get user ID - try both _id and id properties
        const userId = user?._id || user?.id;
        
        // For admin: show total downloads
        // For viewer: show only their own downloads (0 or 1)
        let downloadCount;
        if (isAdmin) {
          // Admin sees total downloads by all users
          downloadCount = downloads && Array.isArray(downloads) ? downloads.length : 0;
        } else {
          // Viewer sees only if they have downloaded (0 or 1)
          if (!userId || !downloads || !Array.isArray(downloads)) {
            downloadCount = 0;
          } else {
            const hasDownloaded = downloads.some(download => {
              if (!download || !download.user) return false;
              const downloadUserId = typeof download.user === 'string' 
                ? download.user 
                : (download.user._id || download.user);
              return downloadUserId && downloadUserId.toString() === userId.toString();
            });
            downloadCount = hasDownloaded ? 1 : 0;
          }
        }
        
        return (
          <Space>
            <DownloadOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: '500' }}>{downloadCount}</span>
          </Space>
        );
      },
      width: '100px',
      responsive: ['md'],
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    {
      title: () => (
        <SortableHeader
          columnKey="uploadedBy.name"
          label="Uploaded By"
          onSort={requestSort}
          getSortIcon={getSortIcon}
          setSearchTerm={setColumnSearchTerm}
          getSearchTerm={getColumnSearchTerm}
        />
      ),
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      render: (uploadedBy) => (
        <Space>
          <UserOutlined style={{ color: '#722ed1' }} />
          <Tag color="purple">{uploadedBy?.name || 'Unknown User'}</Tag>
        </Space>
      ),
      width: '150px',
      responsive: ['lg'],
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
    },
    // Conditionally show Assigned To column
    ...(!isViewer ? [
      {
        title: 'Assigned To',
        dataIndex: 'assignedTo',
        key: 'assignedTo',
        render: (assignedTo, record) => {
          if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) return <Tag color="default">None</Tag>;
          
          return (
            <Space wrap>
              {assignedTo.map(uid => {
                const assignedUser = userMap[uid];
                
                // Check if this assigned user has downloaded the file
                const hasUserDownloaded = record.downloads && Array.isArray(record.downloads)
                  ? record.downloads.some(download => {
                      if (!download || !download.user) return false;
                      
                      // Handle both ObjectId string and populated user object
                      let downloadUserId;
                      if (typeof download.user === 'string') {
                        downloadUserId = download.user;
                      } else if (typeof download.user === 'object' && download.user._id) {
                        downloadUserId = download.user._id.toString();
                      } else {
                        downloadUserId = download.user.toString();
                      }
                      
                      return downloadUserId === uid.toString();
                    })
                  : false;
                
                // Blue if not downloaded, Orange if downloaded
                const tagColor = hasUserDownloaded ? 'darkgreen' : 'blue';
                
                return (
                  <Tag key={uid} color={tagColor} style={{ fontWeight: 500 }}>
                    {assignedUser?.name || uid}
                  </Tag>
                );
              })}
            </Space>
          );
        },
        width: '180px',
        responsive: ['md'],
        onHeaderCell: () => ({ style: tableStyles.headerCell }),
        onCell: () => ({ style: tableStyles.bodyCell }),
      },
    ] : []),
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => {
        const canDelete = hasPermission(user, 'file_management', 'delete');
        const canAssign = isAdmin;
        const canUpdateTiming = isAdmin;
        
        // Check if current user has exceeded download limit for this file
        const hasUserExceededDownloadLimit = (() => {
          // Get user ID - try both _id and id properties
          const userId = user?._id || user?.id;

          if (!user || !userId || !record.downloads || !Array.isArray(record.downloads)) {
            return false;
          }

          const currentUserId = userId.toString();

          // Count how many times this user has downloaded this file
          const userDownloadCount = record.downloads.filter(download => {
            if (!download || !download.user) {
              return false;
            }

            // Handle both ObjectId string and populated user object
            let downloadUserId;
            if (typeof download.user === 'string') {
              downloadUserId = download.user;
            } else if (typeof download.user === 'object' && download.user._id) {
              downloadUserId = download.user._id.toString();
            } else {
              downloadUserId = download.user.toString();
            }

            return downloadUserId === currentUserId;
          }).length;

          // Check if user has exceeded the download limit
          return userDownloadCount >= downloadLimit;
        })();
        
        // isViewer is already defined at component level
        return (
            <Space size="small" wrap>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="small"
                className="gradient-button"
                onClick={() => handleDownloadClick(record)}
                loading={downloadLoading && selectedFile?.id === (record.id || record._id)}
                disabled={
                  (isViewer && record.status !== 'Accepted') ||
                  hasUserExceededDownloadLimit
                }
                title={hasUserExceededDownloadLimit ? `Download limit exceeded (${downloadLimit} downloads allowed)` : ''}
              >
                <span className="action-text">
                  {hasUserExceededDownloadLimit ? 'Limit Exceeded' : 'Download'}
                </span>
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
              {canUpdateTiming && (
                <Button
                  type="default"
                  icon={<ClockCircleOutlined />}
                  size="small"
                  onClick={() => handleOpenTiming(record)}
                  title="Edit timing"
                >
                  Timing
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
                        setSelectedFiles([]); // Clear selections after individual accept
                      } catch (err) {
                        message.error('Failed to accept file');
                      } finally {
                        setAccepting(false);
                      }
                    }}
                  >
                    Accept
                  </Button>
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
      onHeaderCell: () => ({ style: tableStyles.headerCell }),
      onCell: () => ({ style: tableStyles.bodyCell }),
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
          
          <div style={{ display: 'flex', gap: 8 }}>
            {hasPermission(user, 'file_management', 'create') && (
              <Link to="/upload">
                <Button style={responsiveStyles.uploadButton}>
                  <UploadOutlined />
                  <span style={{ marginLeft: '8px' }}>Upload New File</span>
                </Button>
              </Link>
            )}
          </div>
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
            <Col xs={24} sm={12} md={6} lg={4} xl={3}>
              <Select
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="accepted">Accepted</Select.Option>
              </Select>
            </Col>
            {isAdmin && (
              <Col xs={24} sm={12} md={6} lg={4} xl={3}>
                <Select
                  value={groupFilter}
                  onChange={(val) => {
                    setGroupFilter(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: '100%' }}
                  placeholder="Filter by Group"
                >
                  <Select.Option value="all">All Groups</Select.Option>
                  {/* Get unique groups from both users and files */}
                  {getAvailableGroups().map(group => (
                    <Select.Option key={group} value={group}>{group}</Select.Option>
                  ))}
                </Select>
              </Col>
            )}
            <Col xs={24} sm={12} md={12} lg={8} xl={6} style={{ display: 'flex', gap: '8px' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  message.info('Refreshing files...');
                  fetchFiles();
                }}
                title="Refresh file list"
              >
                Refresh
              </Button>
              {isAdmin && selectedFiles.length > 0 && (
                <Button
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  onClick={handleOpenBulkTiming}
                  style={{ background: '#1890ff', borderColor: '#1890ff' }}
                >
                  Bulk Timing Update ({selectedFiles.length})
                </Button>
              )}
              {isViewer && selectedFiles.length > 0 && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={bulkAcceptLoading}
                  onClick={handleBulkAccept}
                  style={{ background: '#00BF96', borderColor: '#00BF96' }}
                >
                  Bulk Accept ({selectedFiles.length})
                </Button>
              )}
            </Col>
            <Col xs={24} sm={12} md={12} lg={8} xl={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                
                icon={<FileExcelOutlined style={{ fontSize: '40px', color: '#217346' }} />}
                onClick={() => {
                  exportFilesToExcel(filteredFiles, {
                    filename: 'files_report.xlsx',
                    userMap,
                    isAdmin,
                    includeDetails: true
                  });
                }}
                title="Export to Excel"
              />
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={sortedData}
          loading={loading}
          rowKey={(record) => record._id || record.id}
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
            size: 'small',
            position: ['topRight', 'bottomRight']
          }}
          scroll={{ x: 'max-content' }}
          style={{
            ...tableStyles.table,
            overflowX: 'auto'
          }}
          onRow={(record, index) => {
            let backgroundColor = '';
            if (record.status === 'Accepted') {
              backgroundColor = '#f6ffed'; // light green for accepted
            } else if (record.status === 'Pending') {
              backgroundColor = '#fff7e6'; // light orange for pending
            }

            // Add striped background for even rows
            const stripedBackground = index % 2 === 0 ? '#fafafa' : 'transparent';
            const finalBackground = backgroundColor || stripedBackground;

            return {
              style: {
                ...tableStyles.bodyCell,
                ...(index === sortedData.length - 1 ? tableStyles.lastRow : {}),
                backgroundColor: finalBackground,
              },
              onMouseEnter: (event) => {
                event.currentTarget.style.background = tableStyles.hoverRow.background;
              },
              onMouseLeave: (event) => {
                event.currentTarget.style.background = finalBackground;
              },
            };
          }}
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
        styles={{ body: { padding: '24px' } }}
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
              placeholder={assignFile?.group ? `Select users from ${assignFile.group}` : "Select users to assign"}
              style={{ width: '100%' }}
              loading={allUsers.length === 0}
              optionFilterProp="children"
              showSearch
              maxTagCount="responsive"
              dropdownStyle={{ maxWidth: '600px' }}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {allUsers
                .filter(u => {
                  // Exclude the uploader
                  if (u._id === assignFile?.uploadedBy?._id || u._id === assignFile?.uploadedBy) {
                    return false;
                  }
                  // If file has a group, only show users from that group
                  if (assignFile?.group) {
                    return u.group === assignFile.group;
                  }
                  // If file has no group, show all users (except uploader)
                  return true;
                })
                .map(user => {
                  const groupName = user.group || 'No Group';
                  const groupColor = groupName === 'No Group' ? '#8c8c8c' :
                    groupName.includes('IIT') ? '#1890ff' :
                    groupName.includes('NIT') ? '#52c41a' : '#722ed1';
                  
                  // Check if user is already assigned
                  const isAlreadyAssigned = Array.isArray(assignFile?.assignedTo) && assignFile.assignedTo.includes(user._id);

                  return (
                    <Select.Option
                      key={user._id}
                      value={user._id}
                      title={`${user.name} (${user.email}) - ${groupName}${isAlreadyAssigned ? ' (Already Assigned)' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{user.name}</span>
                        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>({user.email})</span>
                        <span style={{
                          backgroundColor: groupColor,
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <TeamOutlined style={{ fontSize: '10px' }} />
                          {groupName}
                        </span>
                        {isAlreadyAssigned && (
                          <span style={{
                            backgroundColor: '#52c41a',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            ✓ Assigned
                          </span>
                        )}
                      </div>
                    </Select.Option>
                  );
                })}
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

      {/* Edit Timing Modal (Admin Only) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <ClockCircleOutlined style={{ marginRight: '6px', color: '#00BF96', fontSize: '16px' }} />
            Edit File Timing
          </div>
        }
        open={timingModalVisible}
        onCancel={closeTimingModal}
        footer={null}
        width={450}
        style={{ top: 20 }}
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          form={timingForm}
          name="timing"
          onFinish={handleUpdateTiming}
          layout="vertical"
          size="small"
        >
          <Form.Item
            name="startTime"
            label={<span style={{ fontSize: '13px', fontWeight: '500' }}>Start Time (Required)</span>}
            rules={[{ required: true, message: 'Please select start time' }]}
            style={{ marginBottom: '16px' }}
          >
            <DatePicker
              showTime={{
                defaultValue: dayjs('00:00:00', 'HH:mm:ss'),
              }}
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Select when file becomes available"
              style={{ width: '100%' }}
              size="small"
              disabledDate={(current) => {
                // Disable all dates before today
                return current && current.isBefore(dayjs().startOf('day'));
              }}
              disabledTime={(current) => {
                // If selected date is today, disable past hours/minutes
                if (current && current.isSame(dayjs(), 'day')) {
                  const now = dayjs();
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = 0; i < now.hour(); i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour) => {
                      if (selectedHour === now.hour()) {
                        const minutes = [];
                        for (let i = 0; i < now.minute(); i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    },
                    disabledSeconds: (selectedHour, selectedMinute) => {
                      if (selectedHour === now.hour() && selectedMinute === now.minute()) {
                        const seconds = [];
                        for (let i = 0; i < now.second(); i++) {
                          seconds.push(i);
                        }
                        return seconds;
                      }
                      return [];
                    }
                  };
                }
                return {};
              }}
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label={<span style={{ fontSize: '13px', fontWeight: '500' }}>End Time (Required)</span>}
            rules={[{ required: true, message: 'Please select end time' }]}
            style={{ marginBottom: '16px' }}
          >
            <DatePicker
              showTime={{
                defaultValue: dayjs('23:59:59', 'HH:mm:ss'),
              }}
              format="YYYY-MM-DD HH:mm:ss"
              placeholder={timingForm.getFieldValue('startTime') ? "Select when file expires" : "Select start time first"}
              style={{ width: '100%' }}
              size="small"
              disabled={!timingForm.getFieldValue('startTime')}
              disabledDate={(current) => {
                // Disable dates before start time
                const startTimeValue = timingForm.getFieldValue('startTime');
                if (startTimeValue && current) {
                  return current.isBefore(dayjs(startTimeValue).startOf('day'));
                }
                return false;
              }}
              disabledTime={(current) => {
                if (!current) return {};

                const startTimeValue = timingForm.getFieldValue('startTime');
                if (!startTimeValue) return {};

                const start = dayjs(startTimeValue);

                // If selected date is same as start date, disable times before start time
                if (current.isSame(start, 'day')) {
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = 0; i < start.hour(); i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour) => {
                      if (selectedHour === start.hour()) {
                        const minutes = [];
                        for (let i = 0; i <= start.minute(); i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    },
                    disabledSeconds: (selectedHour, selectedMinute) => {
                      if (selectedHour === start.hour() && selectedMinute === start.minute()) {
                        const seconds = [];
                        for (let i = 0; i <= start.second(); i++) {
                          seconds.push(i);
                        }
                        return seconds;
                      }
                      return [];
                    }
                  };
                }

                return {};
              }}
            />
          </Form.Item>
          <div style={{
            background: '#fff7e6',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ffe7ba',
            marginBottom: '16px'
          }}>
            <Text style={{ fontSize: '12px', color: '#8c6e00' }}>
              <InfoCircleOutlined style={{ marginRight: '4px' }} />
              Leave fields empty to make the file available anytime. Set times to restrict download availability.
            </Text>
          </div>
          {timingError && (
            <Alert
              message="Timing Update Error"
              description={timingError}
              type="error"
              showIcon
              closable
              onClose={() => setTimingError(null)}
              style={{ marginBottom: 16, fontSize: '13px' }}
              size="small"
            />
          )}
          <Form.Item style={{ marginBottom: 0 }}>
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Button onClick={closeTimingModal} size="small">
                  Cancel
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={timingLoading}
                  className="gradient-button"
                  size="small"
                >
                  Update Timing
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Edit Timing Modal (Admin Only) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <ClockCircleOutlined style={{ marginRight: '6px', color: '#00BF96', fontSize: '16px' }} />
            Bulk Update File Timing ({selectedFiles.length} files)
          </div>
        }
        open={bulkTimingModalVisible}
        onCancel={closeBulkTimingModal}
        footer={null}
        width={450}
        style={{ top: 20 }}
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          form={bulkTimingForm}
          name="bulkTiming"
          onFinish={handleBulkUpdateTiming}
          layout="vertical"
          size="small"
        >
          <Form.Item
            name="startTime"
            label={<span style={{ fontSize: '13px', fontWeight: '500' }}>Start Time (Required)</span>}
            rules={[{ required: true, message: 'Please select start time' }]}
            style={{ marginBottom: '16px' }}
          >
            <DatePicker
              showTime={{
                defaultValue: dayjs('00:00:00', 'HH:mm:ss'),
              }}
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Select when files become available"
              style={{ width: '100%' }}
              size="small"
              disabledDate={(current) => {
                // Disable all dates before today
                return current && current.isBefore(dayjs().startOf('day'));
              }}
              disabledTime={(current) => {
                // If selected date is today, disable past hours/minutes
                if (current && current.isSame(dayjs(), 'day')) {
                  const now = dayjs();
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = 0; i < now.hour(); i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour) => {
                      if (selectedHour === now.hour()) {
                        const minutes = [];
                        for (let i = 0; i < now.minute(); i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    },
                    disabledSeconds: (selectedHour, selectedMinute) => {
                      if (selectedHour === now.hour() && selectedMinute === now.minute()) {
                        const seconds = [];
                        for (let i = 0; i < now.second(); i++) {
                          seconds.push(i);
                        }
                        return seconds;
                      }
                      return [];
                    }
                  };
                }
                return {};
              }}
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label={<span style={{ fontSize: '13px', fontWeight: '500' }}>End Time (Required)</span>}
            rules={[{ required: true, message: 'Please select end time' }]}
            style={{ marginBottom: '16px' }}
          >
            <DatePicker
              showTime={{
                defaultValue: dayjs('23:59:59', 'HH:mm:ss'),
              }}
              format="YYYY-MM-DD HH:mm:ss"
              placeholder={bulkTimingForm.getFieldValue('startTime') ? "Select when files expire" : "Select start time first"}
              style={{ width: '100%' }}
              size="small"
              disabled={!bulkTimingForm.getFieldValue('startTime')}
              disabledDate={(current) => {
                // Disable dates before start time
                const startTimeValue = bulkTimingForm.getFieldValue('startTime');
                if (startTimeValue && current) {
                  return current.isBefore(dayjs(startTimeValue).startOf('day'));
                }
                return false;
              }}
              disabledTime={(current) => {
                if (!current) return {};

                const startTimeValue = bulkTimingForm.getFieldValue('startTime');
                if (!startTimeValue) return {};

                const start = dayjs(startTimeValue);

                // If selected date is same as start date, disable times before start time
                if (current.isSame(start, 'day')) {
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = 0; i < start.hour(); i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour) => {
                      if (selectedHour === start.hour()) {
                        const minutes = [];
                        for (let i = 0; i <= start.minute(); i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    },
                    disabledSeconds: (selectedHour, selectedMinute) => {
                      if (selectedHour === start.hour() && selectedMinute === start.minute()) {
                        const seconds = [];
                        for (let i = 0; i <= start.second(); i++) {
                          seconds.push(i);
                        }
                        return seconds;
                      }
                      return [];
                    }
                  };
                }

                return {};
              }}
            />
          </Form.Item>
          <div style={{
            background: '#fff7e6',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ffe7ba',
            marginBottom: '16px'
          }}>
            <Text style={{ fontSize: '12px', color: '#8c6e00' }}>
              <InfoCircleOutlined style={{ marginRight: '4px' }} />
              This will update timing for all {selectedFiles.length} selected files. Both start and end times are required.
            </Text>
          </div>
          {bulkTimingError && (
            <Alert
              message="Bulk Timing Update Error"
              description={bulkTimingError}
              type="error"
              showIcon
              closable
              onClose={() => setBulkTimingError(null)}
              style={{ marginBottom: 16, fontSize: '13px' }}
              size="small"
            />
          )}
          <Form.Item style={{ marginBottom: 0 }}>
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Button onClick={closeBulkTimingModal} size="small">
                  Cancel
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={bulkTimingLoading}
                  className="gradient-button"
                  size="small"
                >
                  Update {selectedFiles.length} Files
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
        styles={{ body: { padding: '24px' } }}
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
                              {selectedFile.originalName || selectedFile.filename}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Size: {formatBytes(selectedFile.size)}
                            </Text>
                            {selectedFile.startTime && (
                              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                Available from: {dayjs(selectedFile.startTime).format('DD/MM/YYYY hh:mm:ss A')}
                              </Text>
                            )}
                            {selectedFile.endTime && (
                              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                Expires on: {dayjs(selectedFile.endTime).format('DD/MM/YYYY hh:mm:ss A')}
                              </Text>
                            )}
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
                            {(() => {
                              const now = new Date();
                              const startTime = selectedFile.startTime ? new Date(selectedFile.startTime) : null;
                              const endTime = selectedFile.endTime ? new Date(selectedFile.endTime) : null;

                              if (startTime && now < startTime) {
                                return (
                                  <div style={{ marginTop: '4px' }}>
                                    <Text type="danger" style={{ fontSize: '12px' }}>
                                      ⏰ Download not available until {dayjs(startTime).format('DD/MM/YYYY hh:mm:ss A')}
                                    </Text>
                                  </div>
                                );
                              } else if (endTime && now > endTime) {
                                return (
                                  <div style={{ marginTop: '4px' }}>
                                    <Text type="danger" style={{ fontSize: '12px' }}>
                                      ⏰ Download expired on {dayjs(endTime).format('DD/MM/YYYY hh:mm:ss A')}
                                    </Text>
                                  </div>
                                );
                              }
                            })()}
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

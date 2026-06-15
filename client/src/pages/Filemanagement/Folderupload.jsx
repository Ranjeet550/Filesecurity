import { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Upload,
  Button,
  Card,
  Alert,
  Space,
  Result,
  Input,
  Divider,
  Tooltip,
  Steps,
  Progress,
  App,
  Row,
  Col,
  Table,
  Tag,
  Select,
  Checkbox,
  DatePicker
} from 'antd';
import dayjs from 'dayjs';
import {
  UploadOutlined,
  FolderOpenOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  FileProtectOutlined,
  CloudUploadOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { uploadFile, assignFileToUsers } from '../../api/fileService';
import { encryptFile } from '../../utils/fileEncryption';
import AuthContext from '../../context/AuthContext';
import { getUsers } from '../../api/userService';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FolderUpload = () => {
  const { message } = App.useApp();
  const { user } = useContext(AuthContext);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [mappingFile, setMappingFile] = useState(null);
  const [mappingData, setMappingData] = useState([]);
  const [headerMapping, setHeaderMapping] = useState({
    QPdetails: '',
    Subcourse: '',
    subject: '',
    session: '',
    semyear: '',
    remark: ''
  });
  const [availableGroups, setAvailableGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [groupUsers, setGroupUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [defaultGroup, setDefaultGroup] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingFile, setCurrentUploadingFile] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    fetchAvailableGroups();
  }, []);

  useEffect(() => {
    if (defaultGroup && allUsers.length > 0) {
      const filteredUsers = allUsers.filter(user => user.group === defaultGroup);
      setGroupUsers(filteredUsers);
      setSelectedUsers([]);
    } else {
      setGroupUsers([]);
      setSelectedUsers([]);
    }
  }, [defaultGroup, allUsers]);

  const fetchAvailableGroups = async () => {
    try {
      const response = await getUsers();
      if (response.data) {
        setAllUsers(response.data);
        const uniqueGroups = [...new Set(response.data.map(user => user.group).filter(group => group))];
        setAvailableGroups(uniqueGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 0; i < 6; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleMappingFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        setMappingData(jsonData);
        setMappingFile(file);
        
        // Auto-detect headers with improved logic
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0]);
          const autoMapping = { ...headerMapping };

          headers.forEach(header => {
            const lowerHeader = header.toLowerCase().replace(/[_\s-]/g, '');
            const normalizedHeader = lowerHeader.replace(/[^a-zA-Z0-9]/g, '');


            // QP Details (enhanced patterns) - prefer "Catch No." over "Paper No."
            if (!autoMapping.QPdetails && (
              lowerHeader === 'catch no.' ||
              normalizedHeader.includes('catch') ||
              normalizedHeader.includes('qp') ||
              normalizedHeader.includes('questionpaper') ||
              normalizedHeader.includes('paper') ||
              normalizedHeader.includes('question') ||
              normalizedHeader.includes('exam') ||
              lowerHeader.includes('qp') ||
              lowerHeader.includes('paper')
            )) {
              autoMapping.QPdetails = header;
            }

            // Subcourse (enhanced patterns)
            if (!autoMapping.Subcourse && (
              normalizedHeader.includes('subcourse') ||
              normalizedHeader.includes('course') ||
              normalizedHeader.includes('program') ||
              normalizedHeader.includes('branch') ||
              normalizedHeader.includes('department') ||
              lowerHeader.includes('subcourse') ||
              lowerHeader.includes('course')
            )) {
              autoMapping.Subcourse = header;
            }

            // Subject (enhanced patterns)
            if (!autoMapping.subject && (
              normalizedHeader.includes('subject') ||
              normalizedHeader.includes('topic') ||
              lowerHeader.includes('subject')
            )) {
              autoMapping.subject = header;
            }

            // Session (enhanced patterns)
            if (!autoMapping.session && (
              normalizedHeader.includes('session') ||
              normalizedHeader.includes('year') ||
              normalizedHeader.includes('academic') ||
              lowerHeader.includes('session')
            )) {
              autoMapping.session = header;
            }

            // Semester/Year (enhanced patterns)
            if (!autoMapping.semyear && (
              normalizedHeader.includes('sem') ||
              normalizedHeader.includes('semester') ||
              normalizedHeader.includes('term') ||
              normalizedHeader.includes('period') ||
              lowerHeader.includes('sem') ||
              lowerHeader.includes('year')
            )) {
              autoMapping.semyear = header;
            }

            // Group/University (enhanced patterns)
            if (!autoMapping.group && (
              normalizedHeader.includes('group') ||
              normalizedHeader.includes('university') ||
              normalizedHeader.includes('college') ||
              normalizedHeader.includes('institution') ||
              normalizedHeader.includes('school') ||
              lowerHeader.includes('group') ||
              lowerHeader.includes('university')
            )) {
              autoMapping.group = header;
            }

            // Start Time (enhanced patterns)
            if (!autoMapping.startTime && (
              normalizedHeader.includes('start') ||
              normalizedHeader.includes('from') ||
              normalizedHeader.includes('begin') ||
              lowerHeader.includes('start') ||
              lowerHeader.includes('from')
            )) {
              autoMapping.startTime = header;
            }

            // Remark (enhanced patterns)
            if (!autoMapping.remark && (
              normalizedHeader.includes('remark') ||
              normalizedHeader.includes('note') ||
              normalizedHeader.includes('comment') ||
              normalizedHeader.includes('description') ||
              lowerHeader.includes('remark') ||
              lowerHeader.includes('note')
            )) {
              autoMapping.remark = header;
            }

            // End Time (enhanced patterns)
            if (!autoMapping.endTime && (
              normalizedHeader.includes('end') ||
              normalizedHeader.includes('to') ||
              normalizedHeader.includes('until') ||
              normalizedHeader.includes('expire') ||
              lowerHeader.includes('end') ||
              lowerHeader.includes('to')
            )) {
              autoMapping.endTime = header;
            }
          });

          setHeaderMapping(autoMapping);
        }
        
        message.success('Mapping file loaded successfully');
      } catch (error) {
        console.error('Error reading Excel file:', error);
        message.error('Failed to read Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const getFileDetailsFromMapping = (filename) => {
    if (!mappingData || mappingData.length === 0) {
      return null;
    }

    // Since filename mapping is removed, use the first row of Excel data as default values
    // This allows all files to be uploaded with metadata from the first Excel row
    const firstRow = mappingData[0];

    // Convert values to strings and handle empty/null values
    const getValue = (key) => {
      if (!key) return '';
      const value = firstRow[key];
      if (value === null || value === undefined) return '';
      return String(value).trim();
    };

    return {
      QPdetails: getValue(headerMapping.QPdetails),
      Subcourse: getValue(headerMapping.Subcourse),
      subject: getValue(headerMapping.subject),
      session: getValue(headerMapping.session),
      semyear: getValue(headerMapping.semyear),
      group: defaultGroup,
      remark: getValue(headerMapping.remark),
      startTime: startTime,
      endTime: endTime
    };
  };

  const handleFolderUpload = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      message.warning(`${file.name} exceeds 10 MB limit and will be skipped`);
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select files to upload');
      return;
    }

    if (!mappingFile) {
      message.error('Please upload an Excel mapping file');
      return;
    }

    // Validate required timing fields
    if (!startTime || !endTime) {
      message.error('Please select both start time and end time for file availability');
      return;
    }


    try {
      setUploading(true);
      setError(null);
      setCurrentStep(1);
      setUploadProgress(0);

      const uploadResults = [];
      const totalFiles = fileList.length;

      for (let i = 0; i < fileList.length; i++) {
        const fileItem = fileList[i];
        const file = fileItem.originFileObj;
        setCurrentUploadingFile(file.name);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));

        // Generate unique password for each file
        const password = generatePassword();

        // Get file details from mapping
        const mappedDetails = getFileDetailsFromMapping(file.name);

        if (!mappedDetails) {
          // No mapping found, using defaults
        }

        const isPDF = file.type === 'application/pdf';
        const isxlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.type === 'application/vnd.ms-excel';

        let fileToUpload;
        let fileWithPassword;
        
        if (isPDF || isxlsx) {
          // For PDF/Excel, don't encrypt - server will apply password protection
          // Use the original file directly
          fileWithPassword = file;
        } else {
          // For other files, encrypt on client side
          fileToUpload = await encryptFile(file, password);
          fileWithPassword = new File([fileToUpload], file.name, {
            type: file.type,
            lastModified: file.lastModified
          });
        }

        // Ensure all values are strings and not empty
        const details = {
          password: password,
          QPdetails: mappedDetails?.QPdetails || '',
          Subcourse: mappedDetails?.Subcourse || '',
          subject: mappedDetails?.subject || '',
          session: mappedDetails?.session || '',
          semyear: mappedDetails?.semyear || '',
          group: mappedDetails?.group || defaultGroup || '',
          remark: mappedDetails?.remark || '',
          startTime: mappedDetails?.startTime || '',
          endTime: mappedDetails?.endTime || ''
        };

        // Upload file with details

        fileWithPassword.password = details.password;
        fileWithPassword.QPdetails = details.QPdetails;
        fileWithPassword.Subcourse = details.Subcourse;
        fileWithPassword.subject = details.subject;
        fileWithPassword.session = details.session;
        fileWithPassword.semyear = details.semyear;
        fileWithPassword.group = details.group;
        fileWithPassword.remark = details.remark;
        fileWithPassword.startTime = details.startTime;
        fileWithPassword.endTime = details.endTime;

        try {
          const response = await uploadFile(fileWithPassword);
          
          if (response && response.data) {
            uploadResults.push({
              ...response.data,
              password: password,
              status: 'success'
            });

            // Assign to users if selected
            if (selectedUsers.length > 0) {
              try {
                await assignFileToUsers(response.data.id, selectedUsers);
              } catch (assignError) {
                console.error('Error assigning file:', assignError);
              }
            }
          }
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          uploadResults.push({
            filename: file.name,
            password: password,
            status: 'failed',
            error: uploadError.message
            });
        }
      }

      setUploadedFiles(uploadResults);
      setFileList([]);
      setCurrentStep(2);
      
      const successCount = uploadResults.filter(r => r.status === 'success').length;
      const failedCount = uploadResults.filter(r => r.status === 'failed').length;
      
      if (failedCount === 0) {
        message.success(`All ${successCount} files uploaded successfully`);
      } else {
        message.warning(`${successCount} files uploaded, ${failedCount} failed`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload files');
      message.error(error.message || 'Failed to upload files');
      setCurrentStep(0);
    } finally {
      setUploading(false);
      setCurrentUploadingFile('');
    }
  };

  const handleCopyAllPasswords = () => {
    const passwordList = uploadedFiles
      .filter(f => f.status === 'success')
      .map(f => `${f.filename}: ${f.password}`)
      .join('\n');
    navigator.clipboard.writeText(passwordList);
    message.success('All passwords copied to clipboard');
  };

  const handleExportResults = () => {
    const exportData = uploadedFiles.map(f => ({
      Filename: f.filename,
      Password: f.password,
      Status: f.status,
      'Upload Date': f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : '',
      'Download Link': f.id ? `${window.location.origin}/download/${f.id}` : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Upload Results');
    XLSX.writeFile(wb, `upload-results-${Date.now()}.xlsx`);
    message.success('Results exported to Excel');
  };

  const columns = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      width: '30%',
      render: (text, record) => (
        <Space>
          {record.status === 'success' ? (
            <FileProtectOutlined style={{ color: '#52c41a' }} />
          ) : (
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          )}
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
      width: '25%',
      render: (text) => (
        <Input.Password
          value={text}
          readOnly
          size="small"
          style={{ fontFamily: 'monospace', fontSize: '12px' }}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => (
        <Tag color={status === 'success' ? 'success' : 'error'}>
          {status === 'success' ? 'Uploaded' : 'Failed'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '30%',
      render: (_, record) => (
        record.status === 'success' ? (
          <Space size="small">
            <Button
              size="small"
              icon={<UploadOutlined />}
              onClick={() => {
                const link = `${window.location.origin}/download/${record.id}?password=${encodeURIComponent(record.password)}`;
                navigator.clipboard.writeText(link);
                message.success('Link copied');
              }}
            >
              Copy Link
            </Button>
          </Space>
        ) : (
          <Text type="danger" style={{ fontSize: '11px' }}>{record.error}</Text>
        )
      )
    }
  ];

  const mappingFileProps = {
    beforeUpload: handleMappingFileUpload,
    maxCount: 1,
    accept: '.xlsx,.xls',
    showUploadList: true
  };

  const folderProps = {
    beforeUpload: (file) => {
      if (handleFolderUpload(file)) {
        setFileList(prev => [...prev, {
          uid: file.uid,
          name: file.name,
          status: 'ready',
          size: file.size,
          type: file.type,
          originFileObj: file
        }]);
      }
      return false;
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(f => f.uid !== file.uid));
    },
    fileList,
    multiple: true,
    directory: true
  };

  return (
    <Sidebar>
      <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <Title level={3} style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
              <FolderOpenOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Folder Upload
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Upload multiple files from a folder with automatic password generation and Excel mapping
            </Text>
          </div>
          <Link to="/file-upload">
            <Button
              type="default"
              icon={<CloudUploadOutlined />}
              style={{
                borderRadius: '6px',
                height: '40px',
                borderColor: '#1890ff',
                color: '#1890ff',
                fontWeight: '800'
              }}
            >
              Single File Upload
            </Button>
          </Link>
        </div>

        {/* Single File Upload Info Banner */}
        {uploadedFiles.length === 0 && (
          <Alert
            message={
              <span style={{ fontWeight: '800' }}>
                <InfoCircleOutlined style={{ marginRight: '6px' }} />
                How Bulk Upload Works
              </span>
            }
            description={
              <div>
                <Text style={{ fontSize: '14px' }}>
                  <strong>Step 1:</strong> Upload an Excel file with file metadata <br />
                  <strong>Step 2:</strong> Select a folder containing PDF/Excel files<br />
                  <strong>Step 3:</strong> Each file gets a unique password and metadata from Excel<br />
                  <strong>Step 4:</strong> Export results with all passwords and download links
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    Need to upload just one file? <Link to="/file-upload" style={{ fontWeight: '500' }}>Use Single File Upload</Link>
                  </Text>
                </div>
              </div>
            }
            type="info"
            showIcon
            closable
            style={{ marginTop: '16px', borderRadius: '6px' }}
          />
        )}

        {error && (
          <Alert
            message="Upload Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginTop: '16px', borderRadius: '6px' }}
          />
        )}

        <Card style={{ marginTop: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Steps
            current={currentStep}
            size="small"
            items={[
              { title: 'Select Files', icon: <FileAddOutlined /> },
              { title: 'Processing', icon: <SafetyOutlined /> },
              { title: 'Complete', icon: <CheckCircleOutlined /> }
            ]}
            style={{ marginBottom: '24px' }}
          />

          {uploadedFiles.length > 0 ? (
            <div>
              <Result
                status="success"
                title={<span style={{ fontSize: '20px', fontWeight: '600' }}>Folder Upload Complete!</span>}
                subTitle={
                  <span style={{ fontSize: '14px' }}>
                    {uploadedFiles.filter(f => f.status === 'success').length} files uploaded successfully
                  </span>
                }
                icon={<FolderOpenOutlined style={{ color: '#52c41a', fontSize: '48px' }} />}
                style={{ padding: '20px 16px' }}
              />

              <Space style={{ marginBottom: '16px' }}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleCopyAllPasswords}
                >
                  Copy All Passwords
                </Button>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportResults}
                >
                  Export to Excel
                </Button>
              </Space>

              <Table
                columns={columns}
                dataSource={uploadedFiles}
                rowKey={(record) => record.id || record.filename}
                pagination={{ pageSize: 10 }}
                size="small"
                style={{ marginTop: '16px' }}
              />

              <Row gutter={[12, 12]} style={{ marginTop: '20px' }}>
                <Col xs={24} sm={12} lg={4}>
                  <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    block
                    style={{ borderRadius: '6px', height: '36px' }}
                  >
                    <Link to="/dashboard" style={{ color: 'white' }}>
                      Back to Dashboard
                    </Link>
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <Button
                    icon={<UploadOutlined />}
                    block
                    onClick={() => {
                      setUploadedFiles([]);
                      setCurrentStep(0);
                      setMappingFile(null);
                      setMappingData([]);
                      setSelectedUsers([]);
                    }}
                    style={{ borderRadius: '6px', height: '36px' }}
                  >
                    Upload Another Folder
                  </Button>
                </Col>
              </Row>
            </div>
          ) : (
            <>
              {/* Step 1: Upload Mapping Excel File */}
              <Card
                size="small"
                style={{
                  marginBottom: '16px',
                  borderRadius: '8px',
                  
                  border: '1px solid lightgray'
                }}
                title={
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <FileExcelOutlined style={{ marginRight: '6px', fontSize: '30px', color: '#52c41a' }} />
                    Step 1: Upload Excel Mapping File
                  </span>
                }
              >
                <Space>
                  <Upload {...mappingFileProps}>
                    <Button
                      icon={<UploadOutlined />}
                      style={{
                        fontWeight: 'bold',
                        backgroundColor: '#52c41a',
                        borderColor: '#52c41a',
                        color: 'white'
                      }}
                    >
                      Select Excel Mapping File
                    </Button>
                  </Upload>
                  {/* <Button
                    type="dashed"
                    size="small"
                    onClick={() => {
                      // Create sample Excel template
                      const sampleData = [
                        {
                          filename: 'exam1.pdf',
                          QPdetails: 'QP-001',
                          Subcourse: 'Computer Science',
                          subject: 'Mathematics',
                          session: '2024-2025',
                          semyear: 'Sem 1',
                          group: 'MIT',
                          startTime: '2024-12-01 09:00:00',
                          endTime: '2024-12-31 23:59:59'
                        },
                        {
                          filename: 'exam2.pdf',
                          QPdetails: 'QP-002',
                          Subcourse: 'Computer Science',
                          subject: 'Physics',
                          session: '2024-2025',
                          semyear: 'Sem 1',
                          group: 'MIT',
                          startTime: '2024-12-01 09:00:00',
                          endTime: '2024-12-31 23:59:59'
                        }
                      ];
                      const ws = XLSX.utils.json_to_sheet(sampleData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Mapping Template');
                      XLSX.writeFile(wb, 'file-mapping-template.xlsx');
                      message.success('Sample template downloaded');
                    }}
                  >
                    Download Sample Template
                  </Button> */}
                </Space>
                <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginTop: '8px' }}>
                  <InfoCircleOutlined style={{ marginRight: '4px' }} />
                  Upload an Excel file containing file details. The system will auto-detect column headers. 
                </Text>

                {mappingFile && mappingData.length > 0 && (
                   <div style={{ marginTop: '16px' }}>
                     <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                       Map Excel Headers to File Details:
                     </Text>
                     <Row gutter={[12, 12]}>
                       {Object.keys(headerMapping).map(key => (
                         <Col xs={24} sm={12} md={8} key={key}>
                           <div>
                             <Text style={{
                               fontSize: '12px',
                               fontWeight: '500'
                             }}>
                               {key === 'QPdetails' ? 'Catch No' :
                                key === 'Subcourse' ? 'Course' :
                                key.charAt(0).toUpperCase() + key.slice(1)}:
                             </Text>
                             <Select
                               value={headerMapping[key]}
                               onChange={(value) => setHeaderMapping({ ...headerMapping, [key]: value })}
                               placeholder={`Select ${key} column`}
                               size="small"
                               style={{
                                 width: '100%',
                                 marginTop: '4px',
                                 borderColor: key === 'filename' && !headerMapping.filename ? '#ff4d4f' : undefined
                               }}
                               allowClear
                               status={key === 'filename' && !headerMapping.filename ? 'error' : undefined}
                             >
                               {Object.keys(mappingData[0] || {}).map(header => (
                                 <Select.Option key={header} value={header}>
                                   {header}
                                 </Select.Option>
                               ))}
                             </Select>
                           </div>
                         </Col>
                       ))}
                     </Row>
                    <Alert
                      message={`Loaded ${mappingData.length} rows from Excel file`}
                      type="success"
                      showIcon
                      style={{ marginTop: '12px' }}
                    />
                    
                    {/* Excel Data Preview */}
                    <div style={{ marginTop: '16px' }}>
                      <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                        Excel Data Preview (First 5 rows):
                      </Text>
                      <div style={{ overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
                        <Table
                          dataSource={mappingData.slice(0, 5).map((row, index) => ({ ...row, key: index }))}
                          columns={Object.keys(mappingData[0] || {}).map(header => ({
                            title: header,
                            dataIndex: header,
                            key: header,
                            width: 150,
                            render: (text) => (
                              <Text style={{ fontSize: '11px' }}>
                                {text !== null && text !== undefined ? String(text) : '-'}
                              </Text>
                            )
                          }))}
                          pagination={false}
                          size="small"
                          scroll={{ x: 'max-content' }}
                        />
                      </div>
                      <Text style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '8px', display: 'block' }}>
                        Showing first 5 of {mappingData.length} rows. Verify your data is correct.
                      </Text>
                    </div>
                  </div>
                )}
              </Card>

              {/* Step 2: Select Folder */}
              <div style={{
                background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                borderRadius: '8px',
                padding: '24px 16px',
                border: '2px dashed #91d5ff',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <Dragger {...folderProps} style={{ background: 'transparent', border: 'none', padding: '0' }}>
                  <div style={{ padding: '16px' }}>
                    <FolderOpenOutlined style={{ fontSize: '36px', color: '#52c41a', marginBottom: '12px' }} />
                    <Title level={4} style={{ margin: '0 0 8px 0', color: '#262626', fontSize: '16px' }}>
                      Select a folder to upload
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      Only PDF and Excel files will be processed (max 10MB each)
                    </Text>
                  </div>
                </Dragger>
              </div>

              {fileList.length > 0 && (
                <Card
                  size="small"
                  style={{ marginBottom: '16px', borderRadius: '6px' }}
                  title={
                    <span style={{ fontSize: '14px' }}>
                      Selected Files with Mapping Preview ({fileList.length})
                    </span>
                  }
                  extra={
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setFileList([])}
                    >
                      Clear All
                    </Button>
                  }
                >
                  <div style={{ overflowX: 'auto' }}>
                    <Table
                      dataSource={fileList.map(file => {
                        const mappedDetails = getFileDetailsFromMapping(file.name);
                        return {
                          key: file.uid,
                          filename: file.name,
                          size: (file.size / 1024).toFixed(2) + ' KB',
                          type: file.type,
                          mapped: !!mappedDetails,
                          QPdetails: mappedDetails?.QPdetails || '-',
                          Subcourse: mappedDetails?.Subcourse || '-',
                          subject: mappedDetails?.subject || '-',
                          session: mappedDetails?.session || '-',
                          semyear: mappedDetails?.semyear || '-',
                          group: mappedDetails?.group || defaultGroup || '-',
                          remark: mappedDetails?.remark || '-'
                        };
                      })}
                      columns={[
                        {
                          title: 'File',
                          dataIndex: 'filename',
                          key: 'filename',
                          width: 200,
                          fixed: 'left',
                          render: (text, record) => (
                            <Space>
                              {record.type.includes('pdf') ? (
                                <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                              ) : (
                                <FileExcelOutlined style={{ color: '#52c41a' }} />
                              )}
                              <Text style={{ fontSize: '12px' }}>{text}</Text>
                            </Space>
                          )
                        },
                        {
                          title: 'Mapped',
                          dataIndex: 'mapped',
                          key: 'mapped',
                          width: 80,
                          render: (mapped) => (
                            <Tag color={mapped ? 'success' : 'warning'}>
                              {mapped ? 'Yes' : 'No'}
                            </Tag>
                          )
                        },
                        {
                          title: 'Catch No',
                          dataIndex: 'QPdetails',
                          key: 'QPdetails',
                          width: 120,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type={text === '-' ? 'secondary' : undefined}>
                              {text}
                            </Text>
                          )
                        },
                        {
                          title: 'Course',
                          dataIndex: 'Subcourse',
                          key: 'Subcourse',
                          width: 120,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type={text === '-' ? 'secondary' : undefined}>
                              {text}
                            </Text>
                          )
                        },
                        {
                          title: 'Subject',
                          dataIndex: 'subject',
                          key: 'subject',
                          width: 120,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type={text === '-' ? 'secondary' : undefined}>
                              {text}
                            </Text>
                          )
                        },
                        {
                          title: 'Session',
                          dataIndex: 'session',
                          key: 'session',
                          width: 100,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type={text === '-' ? 'secondary' : undefined}>
                              {text}
                            </Text>
                          )
                        },
                        {
                          title: 'Sem/Year',
                          dataIndex: 'semyear',
                          key: 'semyear',
                          width: 100,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type={text === '-' ? 'secondary' : undefined}>
                              {text}
                            </Text>
                          )
                        },
                        {
                          title: 'Group',
                          dataIndex: 'group',
                          key: 'group',
                          width: 120,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type={text === '-' ? 'secondary' : undefined}>
                              {text}
                            </Text>
                          )
                        },
                        {
                          title: 'Remark',
                          dataIndex: 'remark',
                          key: 'remark',
                          width: 120,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type={text === '-' ? 'secondary' : undefined}>
                              {text}
                            </Text>
                          )
                        },
                        {
                          title: 'Size',
                          dataIndex: 'size',
                          key: 'size',
                          width: 80,
                          render: (text) => (
                            <Text style={{ fontSize: '11px' }} type="secondary">
                              {text}
                            </Text>
                          )
                        }
                      ]}
                      pagination={false}
                      scroll={{ x: 1200, y: 300 }}
                      size="small"
                    />
                  </div>
                  <Alert
                    message={
                      <span>
                        <InfoCircleOutlined style={{ marginRight: '6px' }} />
                        {fileList.filter(f => getFileDetailsFromMapping(f.name)).length} of {fileList.length} files have mapping data
                      </span>
                    }
                    description={
                      fileList.filter(f => getFileDetailsFromMapping(f.name)).length < fileList.length ? (
                        <div style={{ marginTop: '8px' }}>
                          <Text style={{ fontSize: '11px', color: '#d46b08' }}>
                            <strong>Files without mapping:</strong>
                          </Text>
                          <div style={{ marginTop: '4px', maxHeight: '60px', overflowY: 'auto' }}>
                            {fileList
                              .filter(f => !getFileDetailsFromMapping(f.name))
                              .map(f => (
                                <div key={f.uid} style={{ fontSize: '11px', color: '#8c6e00' }}>
                                  • {f.name}
                                </div>
                              ))}
                          </div>
                          <Text style={{ fontSize: '11px', color: '#d46b08', marginTop: '4px' }}>
                            Check: filename spelling in Excel, column mapping, or use "Test Mapping" button for details.
                          </Text>
                        </div>
                      ) : null
                    }
                    type={fileList.filter(f => getFileDetailsFromMapping(f.name)).length === fileList.length ? 'success' : 'warning'}
                    showIcon={false}
                    style={{ marginTop: '12px', fontSize: '12px' }}
                  />
                </Card>
              )}

              {/* File Timing Section */}
              <Card
                size="small"
                style={{
                  marginBottom: '16px',
                  borderRadius: '6px',
                 
                  border: '1px solid lightgray'
                }}
                title={
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <InfoCircleOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
                    File Timing 
                  </span>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#262626',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        🟢 Start Time
                        <Text style={{ fontSize: '14px', color: '#ff4d4f', marginLeft: '4px' }}>*</Text>
                      </Text>
                      <DatePicker
                        value={startTime ? dayjs(startTime) : null}
                        onChange={(date) => {
                          setStartTime(date ? date.toISOString() : '');
                          // Clear end time if it's before the new start time
                          if (date && endTime && dayjs(endTime).isBefore(date)) {
                            setEndTime('');
                            message.warning('End time cleared as it was before the new start time');
                          }
                        }}
                        showTime={{
                          defaultValue: dayjs('00:00:00', 'HH:mm:ss'),
                        }}
                        format="YYYY-MM-DD HH:mm:ss"
                        placeholder="Select when files become available"
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
                        style={{
                          marginTop: '6px',
                          width: '70%',
                          borderRadius: '4px',
                          border: '1px solid #d9d9d9',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#262626',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        🔴 End Time
                        <Text style={{ fontSize: '13px', color: '#ff4d4f', marginLeft: '4px' }}>*</Text>
                      </Text>
                      <DatePicker
                        value={endTime ? dayjs(endTime) : null}
                        onChange={(date) => setEndTime(date ? date.toISOString() : '')}
                        showTime={{
                          defaultValue: dayjs('23:59:59', 'HH:mm:ss'),
                        }}
                        format="YYYY-MM-DD HH:mm:ss"
                        placeholder={startTime ? "Select when files expire" : "Select start time first"}
                        size="small"
                        disabled={!startTime}
                        disabledDate={(current) => {
                          // Disable dates before start time
                          if (startTime && current) {
                            return current.isBefore(dayjs(startTime).startOf('day'));
                          }
                          return false;
                        }}
                        disabledTime={(current) => {
                          if (!current || !startTime) return {};

                          const start = dayjs(startTime);

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
                        style={{
                          marginTop: '6px',
                          width: '70%',
                          borderRadius: '4px',
                          border: '1px solid #d9d9d9',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </Col>
                </Row>
                
              </Card>

              {/* Group and User Selection */}
              {(user?.role?.name === 'admin' || user?.role?.name === 'superadmin') && (
                <Card
                  size="small"
                  style={{
                    marginBottom: '16px',
                    borderRadius: '6px',
                   
                    border: '1px solid silver'
                  }}
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
                      <TeamOutlined style={{ marginRight: '6px', color: '#fa8c16' }} />
                      Group & User Assignment
                    </span>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Text style={{ fontSize: '14px', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
                         Group*
                      </Text>
                      <Select
                        value={defaultGroup}
                        onChange={setDefaultGroup}
                        placeholder="Select default group"
                        size="small"
                        style={{ width: '70%' }}
                        showSearch
                        allowClear
                      >
                        {availableGroups.map(groupName => (
                          <Select.Option key={groupName} value={groupName}>
                            {groupName}
                          </Select.Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text style={{ fontSize: '14px', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
                        Assign to Users:
                      </Text>
                      <Select
                        mode="multiple"
                        value={selectedUsers}
                        onChange={setSelectedUsers}
                        placeholder="Select users"
                        size="small"
                        style={{ width: '70%' }}
                        showSearch
                        disabled={!defaultGroup || groupUsers.length === 0}
                      >
                        {groupUsers.map(user => (
                          <Select.Option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </Select.Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>
                </Card>
              )}

              {/* Upload Button */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  type="primary"
                  onClick={handleUpload}
                  disabled={fileList.length === 0 || !mappingFile}
                  loading={uploading}
                  icon={<UploadOutlined />}
                  size="large"
                  style={{ borderRadius: '6px', fontWeight: '600', paddingLeft: '32px', paddingRight: '32px' }}
                >
                  {uploading ? 'Uploading...' : `Upload ${fileList.length} File(s)`}
                </Button>
              </div>

              {uploading && (
                <Card style={{
                  borderRadius: '6px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f6ffed 0%, #fff2e8 100%)',
                  marginTop: '16px'
                }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Progress
                      percent={uploadProgress}
                      status="active"
                      strokeColor={{ '0%': '#52c41a', '100%': '#389e0d' }}
                      strokeWidth={8}
                    />
                    <div>
                      <SafetyOutlined style={{ fontSize: '18px', color: '#52c41a', marginBottom: '6px' }} />
                      <Text style={{ display: 'block', fontSize: '14px', fontWeight: '500' }}>
                        Encrypting and uploading files...
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Currently processing: {currentUploadingFile}
                      </Text>
                    </div>
                  </Space>
                </Card>
              )}
            </>
          )}
        </Card>
      </div>
    </Sidebar>
  );
};

export default FolderUpload;

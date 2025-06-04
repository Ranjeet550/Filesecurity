import { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  App
} from 'antd';
import {
  FileOutlined,
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { getFiles } from '../../api/fileService';
import AuthContext from '../../context/AuthContext';
// Removed STORAGE_LIMIT import - unlimited storage
import FilesTable from './FilesTable';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalDownloads: 0,
    recentUploads: 0,
    storageUsed: 0
    // No storage limit - unlimited storage
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if we should show all files view
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'all-files') {
      setActiveView('all-files');
    } else {
      setActiveView('dashboard');
    }
  }, [searchParams]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await getFiles();
      setFiles(response.data);

      // Set admin flag from API response
      setIsAdmin(response.isAdmin || false);

      // Calculate stats
      const totalFiles = response.data.length;
      const totalDownloads = response.data.reduce((acc, file) => {
        const downloadCount = file.downloads && Array.isArray(file.downloads) ? file.downloads.length : 0;
        return acc + downloadCount;
      }, 0);
      const recentUploads = response.data.filter(
        file => new Date(file.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      const storageUsed = response.data.reduce((acc, file) => acc + (file.size || 0), 0);

      setStats({
        totalFiles,
        totalDownloads,
        recentUploads,
        storageUsed
        // No storage limit - unlimited storage
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching files:', error);

      // Check if it's an authentication error
      if (error.message === 'Not authorized to access this route' ||
          error.message?.includes('authentication') ||
          error.message?.includes('token')) {
        message.error('Your session has expired. Please log in again.');
        // Log the user out and redirect to login
        logout();
        navigate('/login');
      } else {
        message.error('Failed to fetch files');
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };



  // No storage limits - unlimited storage

  return (
    <Sidebar >
      <div className="fade-in">
        {activeView === 'dashboard' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <Title level={3} style={{ margin: '0 0 8px 0', color: '#1a2141' }}>Welcome back, {user?.name}!</Title>
              <Text type="secondary">Here's an overview of your secure file transfers</Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: '#666666', fontSize: '14px', fontWeight: '500' }}>Total Files</span>}
                    value={stats.totalFiles}
                    valueStyle={{ color: '#1a1a1a', fontSize: '32px', fontWeight: '600' }}
                    prefix={<FileOutlined style={{ color: '#1890ff', fontSize: '20px', marginRight: '8px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: '#666666', fontSize: '14px', fontWeight: '500' }}>Downloads</span>}
                    value={stats.totalDownloads}
                    valueStyle={{ color: '#1a1a1a', fontSize: '32px', fontWeight: '600' }}
                    prefix={<DownloadOutlined style={{ color: '#52c41a', fontSize: '20px', marginRight: '8px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: '#666666', fontSize: '14px', fontWeight: '500' }}>Recent Uploads</span>}
                    value={stats.recentUploads}
                    valueStyle={{ color: '#1a1a1a', fontSize: '32px', fontWeight: '600' }}
                    prefix={<UploadOutlined style={{ color: '#fa8c16', fontSize: '20px', marginRight: '8px' }} />}
                    suffix={<small style={{ fontSize: '12px', color: '#999999', fontWeight: '400' }}>/7 days</small>}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  styles={{
                    body: { padding: '24px' }
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: '#666666', fontSize: '14px', fontWeight: '500' }}>Total Storage Used</span>}
                    value={formatBytes(stats.storageUsed)}
                    valueStyle={{ color: '#1a1a1a', fontSize: '32px', fontWeight: '600' }}
                    prefix={<InfoCircleOutlined style={{ color: '#52c41a', fontSize: '20px', marginRight: '8px' }} />}
                    suffix={<small style={{ fontSize: '12px', color: '#999999', fontWeight: '400' }}>unlimited</small>}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}

        <FilesTable
          files={files}
          loading={loading}
          fetchFiles={fetchFiles}
          activeView={activeView}
          isAdmin={isAdmin}
        />
      </div>
    </Sidebar >
  );
};

export default Dashboard;

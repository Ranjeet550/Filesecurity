import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Space, Form, DatePicker, Select, Row, Col, Statistic, Card,
  Drawer, Tag, Input, Empty, Spin, App, Popconfirm, Tooltip,
  Badge, Collapse, Modal, Alert, theme
} from 'antd';
import {
  ReloadOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined,
  SearchOutlined, ClearOutlined, FileExcelOutlined, LineChartOutlined,
  BugOutlined, AlertOutlined, CheckCircleOutlined, InfoCircleOutlined,
  CloseCircleOutlined, WarningOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSystemLogs, getActivityStats, clearOldActivities } from '../../api/logsService';
import { hasPermission } from '../../utils/permissions';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import relativeTime from 'dayjs/plugin/relativeTime';
import Sidebar from '../../components/Sidebar';

dayjs.extend(relativeTime);

const SystemLogs = () => {
  const { user } = useContext(AuthContext);
  const { message } = App.useApp();
  const { token } = theme.useToken();

  // State
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState([null, null]);
  const [clearLogsModalOpen, setClearLogsModalOpen] = useState(false);
  const [clearDaysInput, setClearDaysInput] = useState(90);
  const [clearingLogs, setClearingLogs] = useState(false);

  // Fetch system logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(levelFilter !== 'all' && { level: levelFilter }),
        ...(dateRange[0] && { startDate: dateRange[0].toISOString() }),
        ...(dateRange[1] && { endDate: dateRange[1].toISOString() })
      };

      const response = await getSystemLogs(params);
      const dataArray = Array.isArray(response?.data) ? response.data : [];
      setLogs(dataArray);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Failed to fetch system logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getActivityStats({ days: 30 });
      setStats(response.data || response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (hasPermission(user, 'system_management', 'view')) {
      fetchLogs();
      fetchStats();
    }
  }, [currentPage, pageSize, levelFilter, dateRange]);

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const searchLower = searchTerm.toLowerCase();
    return logs.filter(log =>
      (log.message || '').toLowerCase().includes(searchLower) ||
      (log.source || '').toLowerCase().includes(searchLower) ||
      (log.details || '').toLowerCase().includes(searchLower)
    );
  }, [logs, searchTerm]);

  // Clear old logs handler
  const handleClearLogs = async () => {
    setClearingLogs(true);
    try {
      await clearOldActivities(clearDaysInput);
      message.success(`Cleared logs older than ${clearDaysInput} days`);
      setClearLogsModalOpen(false);
      fetchLogs();
    } catch (error) {
      message.error(error.message || 'Failed to clear logs');
    } finally {
      setClearingLogs(false);
    }
  };

  // Get log level icon and color
  const getLogLevelInfo = (action) => {
    const levels = {
      error: { icon: <CloseCircleOutlined />, color: 'red', label: 'Error' },
      warn: { icon: <WarningOutlined />, color: 'orange', label: 'Warning' },
      warning: { icon: <WarningOutlined />, color: 'orange', label: 'Warning' },
      info: { icon: <InfoCircleOutlined />, color: 'blue', label: 'Info' },
      system: { icon: <AlertOutlined />, color: 'purple', label: 'System' },
      server_start: { icon: <CheckCircleOutlined />, color: 'green', label: 'Server Start' },
      server_stop: { icon: <CloseCircleOutlined />, color: 'red', label: 'Server Stop' }
    };
    return levels[action] || { icon: <InfoCircleOutlined />, color: 'blue', label: action };
  };

  // Table columns
  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '150px',
      render: (date) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
          <span>{dayjs(date).fromNow()}</span>
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: 'Level',
      dataIndex: 'action',
      key: 'action',
      width: '100px',
      render: (action) => {
        const info = getLogLevelInfo(action);
        return (
          <Tag icon={info.icon} color={info.color}>
            {info.label}
          </Tag>
        );
      }
    },
    {
      title: 'Source',
      dataIndex: 'activityType',
      key: 'activityType',
      width: '150px',
      render: (type) => <span style={{ fontFamily: 'monospace' }}>{type}</span>
    },
    {
      title: 'Message',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '100px',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedLog(record);
              setDrawerOpen(true);
            }}
            title="View details"
          />
          {hasPermission(user, 'system_management', 'delete') && (
            <Popconfirm
              title="Delete log?"
              description="This action cannot be undone."
              onConfirm={() => {
                const newLogs = logs.filter(l => l._id !== record._id);
                setLogs(newLogs);
                message.success('Log deleted');
              }}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // Check permission
  if (!hasPermission(user, 'system_management', 'view') || (user?.role?.name !== 'superadmin' && user?.role !== 'superadmin')) {
    return (
      <Empty
        description="Access Denied"
        style={{ marginTop: '50px' }}
        children={<span style={{ color: '#8c8c8c' }}>You don't have permission to view system logs</span>}
      />
    );
  }

  return (
    <Sidebar>
      <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a2141' }}>
            System Logs
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setCurrentPage(1);
                fetchLogs();
                fetchStats();
              }}
              loading={loading || statsLoading}
            >
              Refresh
            </Button>
            {hasPermission(user, 'system_management', 'delete') && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setClearLogsModalOpen(true)}
              >
                Clear Old Logs
              </Button>
            )}
          </Space>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Total Actions (30d)"
                  value={stats.typeStats?.reduce((sum, s) => sum + s.count, 0) || 0}
                  prefix={<LineChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="System Events"
                  value={stats.typeStats?.find(s => s._id === 'system')?.count || 0}
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Auth Events"
                  value={stats.typeStats?.find(s => s._id === 'auth')?.count || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="File Events"
                  value={stats.typeStats?.find(s => s._id === 'file')?.count || 0}
                  prefix={<FileExcelOutlined />}
                  valueStyle={{ color: '#00BF96' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={8}>
              <Form.Item label="Search Logs" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="Search by message, source..."
                  prefix={<SearchOutlined />}
                  suffix={
                    searchTerm && (
                      <ClearOutlined
                        style={{ cursor: 'pointer', color: '#8c8c8c' }}
                        onClick={() => setSearchTerm('')}
                      />
                    )
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item label="Log Level" style={{ marginBottom: 0 }}>
                <Select
                  value={levelFilter}
                  onChange={setLevelFilter}
                >
                  <Select.Option value="all">All Levels</Select.Option>
                  <Select.Option value="error">Error</Select.Option>
                  <Select.Option value="warn">Warning</Select.Option>
                  <Select.Option value="warning">Warning</Select.Option>
                  <Select.Option value="info">Info</Select.Option>
                  <Select.Option value="system">System</Select.Option>
                  <Select.Option value="server_start">Server Start</Select.Option>
                  <Select.Option value="server_stop">Server Stop</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item label="Date Range" style={{ marginBottom: 0 }}>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates || [null, null])}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4} lg={6}>
              <Form.Item label="Items Per Page" style={{ marginBottom: 0 }}>
                <Select value={pageSize} onChange={setPageSize}>
                  <Select.Option value={10}>10</Select.Option>
                  <Select.Option value={20}>20</Select.Option>
                  <Select.Option value={50}>50</Select.Option>
                  <Select.Option value={100}>100</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Logs View */}
      <Card loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: currentPage,
            pageSize,
            onChange: setCurrentPage,
            showTotal: (total) => `Total ${total} logs`,
            showSizeChanger: false
          }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="No logs found" /> }}
        />
      </Card>

      <Drawer
        title={
          selectedLog && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getLogLevelInfo(selectedLog.action).icon}
              <span>Log Details</span>
            </div>
          )
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={500}
      >
        {selectedLog && (
          <Collapse
            items={[
              {
                key: '1',
                label: 'General Information',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>LEVEL</div>
                      <Tag color={getLogLevelInfo(selectedLog.action).color}>
                        {getLogLevelInfo(selectedLog.action).label}
                      </Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>TYPE</div>
                      <Tag color="default">{selectedLog.activityType}</Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>TIMESTAMP</div>
                      <div>{dayjs(selectedLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>ACTION</div>
                      <div style={{ fontFamily: 'monospace' }}>{selectedLog.action}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>DESCRIPTION</div>
                      <div>{selectedLog.description}</div>
                    </div>
                  </div>
                )
              },
              {
                key: '2',
                label: 'Request Details',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>METHOD</div>
                      <Tag color="blue">{selectedLog.method}</Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>PATH</div>
                      <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '12px' }}>
                        {selectedLog.path}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>STATUS CODE</div>
                      <Tag
                        color={
                          selectedLog.statusCode >= 200 && selectedLog.statusCode < 300
                            ? 'green'
                            : selectedLog.statusCode >= 400 && selectedLog.statusCode < 500
                            ? 'orange'
                            : 'red'
                        }
                      >
                        {selectedLog.statusCode}
                      </Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>IP ADDRESS</div>
                      <div style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>USER AGENT</div>
                      <div style={{ fontSize: '12px', wordBreak: 'break-word', color: '#595959' }}>
                        {selectedLog.userAgent}
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: '3',
                label: 'Location Information',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>CITY</div>
                      <div>{selectedLog.location?.city || 'Unknown'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>COUNTRY</div>
                      <div>{selectedLog.location?.country || 'Unknown'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>COORDINATES</div>
                      <div style={{ fontFamily: 'monospace' }}>
                        {selectedLog.location?.latitude || 0}, {selectedLog.location?.longitude || 0}
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: '4',
                label: 'Additional Data',
                children: (
                  <pre style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '400px',
                    fontSize: '12px'
                  }}>
                    {JSON.stringify(selectedLog.data, null, 2)}
                  </pre>
                )
              }
            ]}
          />
        )}
      </Drawer>

      {/* Clear Logs Modal */}
      <Modal
        title="Clear Old Logs"
        open={clearLogsModalOpen}
        onCancel={() => setClearLogsModalOpen(false)}
        footer={null}
      >
        <Alert
          message="This will permanently delete logs older than the specified number of days"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form layout="vertical">
          <Form.Item
            label="Delete logs older than (days)"
            style={{ marginBottom: '16px' }}
          >
            <Input
              type="number"
              min={1}
              value={clearDaysInput}
              onChange={(e) => setClearDaysInput(parseInt(e.target.value) || 90)}
            />
          </Form.Item>
          <Row gutter={[8, 8]} justify="end">
            <Col>
              <Button onClick={() => setClearLogsModalOpen(false)}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                danger
                loading={clearingLogs}
                onClick={handleClearLogs}
              >
                Delete
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
      </div>
    </Sidebar>
  );
};

export default SystemLogs;

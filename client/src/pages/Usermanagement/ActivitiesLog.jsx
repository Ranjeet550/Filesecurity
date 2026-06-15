import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Space, Form, DatePicker, Select, Row, Col, Statistic, Card,
  Drawer, Tag, Input, Empty, Spin, App, Popconfirm, Tooltip,
  Badge, Avatar, Collapse, Modal, Alert, List, Progress, theme
} from 'antd';
import {
  ReloadOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined,
  SearchOutlined, ClearOutlined, FileExcelOutlined, LineChartOutlined,
  FileOutlined, UserOutlined, LockOutlined, TeamOutlined, SettingOutlined,
  CalendarOutlined, EnvironmentOutlined, BgColorsOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getActivities, getActivityStats, exportActivities } from '../../api/logsService';
import { hasPermission } from '../../utils/permissions';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import relativeTime from 'dayjs/plugin/relativeTime';
import Sidebar from '../../components/Sidebar';

dayjs.extend(relativeTime);

const ActivitiesLog = () => {
  const { user } = useContext(AuthContext);
  const { message } = App.useApp();
  const { token } = theme.useToken();

  // State
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState([null, null]);
  const [exporting, setExporting] = useState(false);

  // Fetch activities
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(dateRange[0] && { startDate: dateRange[0].toISOString() }),
        ...(dateRange[1] && { endDate: dateRange[1].toISOString() })
      };

      const response = await getActivities(params);
      const dataArray = Array.isArray(response?.data) ? response.data : [];
      setActivities(dataArray);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Failed to fetch activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getActivityStats({ days: 30 });
      const statsData = response.data || response;
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (hasPermission(user, 'system_management', 'view')) {
      fetchActivities();
      fetchStats();
    }
  }, [currentPage, pageSize, typeFilter, dateRange]);

  // Filter activities based on search
  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) return activities;
    const searchLower = searchTerm.toLowerCase();
    return activities.filter(activity =>
      (activity.description || '').toLowerCase().includes(searchLower) ||
      (activity.action || '').toLowerCase().includes(searchLower) ||
      (activity.user?.name || '').toLowerCase().includes(searchLower) ||
      (activity.path || '').toLowerCase().includes(searchLower)
    );
  }, [activities, searchTerm]);

  // Export activities
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(dateRange[0] && { startDate: dateRange[0].toISOString() }),
        ...(dateRange[1] && { endDate: dateRange[1].toISOString() })
      };
      await exportActivities(params);
      message.success('Activities exported successfully');
    } catch (error) {
      message.error(error.message || 'Failed to export activities');
    } finally {
      setExporting(false);
    }
  };

  // Get activity type icon and color
  const getActivityTypeInfo = (type) => {
    const types = {
      auth: { icon: <LockOutlined />, color: 'blue', label: 'Authentication', bgColor: '#e6f7ff' },
      file: { icon: <FileOutlined />, color: 'green', label: 'File', bgColor: '#f6ffed' },
      user: { icon: <UserOutlined />, color: 'purple', label: 'User', bgColor: '#f9f0ff' },
      system: { icon: <SettingOutlined />, color: 'orange', label: 'System', bgColor: '#fff7e6' }
    };
    return types[type] || types.system;
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
      title: 'Type',
      dataIndex: 'activityType',
      key: 'activityType',
      width: '100px',
      render: (type) => {
        const info = getActivityTypeInfo(type);
        return (
          <Tag icon={info.icon} color={info.color}>
            {info.label}
          </Tag>
        );
      }
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: '150px',
      render: (user) => (
        user ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>{user.name}</span>
          </Space>
        ) : (
          <span style={{ color: '#8c8c8c' }}>System</span>
        )
      )
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: '120px',
      render: (action) => (
        <Tag color="default">{action}</Tag>
      )
    },
    {
      title: 'Description',
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
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: '120px',
      render: (ip) => <span style={{ fontFamily: 'monospace' }}>{ip}</span>
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: '100px',
      render: (code) => {
        let color = 'green';
        if (code >= 400 && code < 500) color = 'orange';
        if (code >= 500) color = 'red';
        return <Tag color={color}>{code || '-'}</Tag>;
      }
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
              setSelectedActivity(record);
              setDrawerOpen(true);
            }}
            title="View details"
          />
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
        children={<span style={{ color: '#8c8c8c' }}>You don't have permission to view activities</span>}
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
            Activities Log
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setCurrentPage(1);
                fetchActivities();
                fetchStats();
              }}
              loading={loading || statsLoading}
            >
              Refresh
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExport}
              loading={exporting}
            >
              Export
            </Button>
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
                  title="File Operations"
                  value={stats.typeStats?.find(s => s._id === 'file')?.count || 0}
                  prefix={<FileOutlined />}
                  valueStyle={{ color: '#00BF96' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Authentication"
                  value={stats.typeStats?.find(s => s._id === 'auth')?.count || 0}
                  prefix={<LockOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="User Management"
                  value={stats.typeStats?.find(s => s._id === 'user')?.count || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Top Actions */}
        {stats?.actionStats && (
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col xs={24} md={12} lg={12}>
              <Card title="Top Actions" size="small" loading={statsLoading}>
                <List
                  size="small"
                  dataSource={stats.actionStats?.slice(0, 5) || []}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: '8px 0' }}>
                      <List.Item.Meta
                        avatar={<Badge count={index + 1} />}
                        title={item._id}
                        description={
                          <Progress percent={(item.count / (stats.actionStats?.[0]?.count || 1)) * 100} size="small" />
                        }
                      />
                      <div>{item.count} actions</div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={12}>
              <Card title="Activity by Type" size="small" loading={statsLoading}>
                <List
                  size="small"
                  dataSource={stats.typeStats || []}
                  renderItem={(item) => {
                    const typeInfo = getActivityTypeInfo(item._id);
                    return (
                      <List.Item style={{ padding: '8px 0' }}>
                        <List.Item.Meta
                          avatar={<Badge count={typeInfo.icon} style={{ backgroundColor: token.colorPrimary }} />}
                          title={typeInfo.label}
                          description={
                            <Progress percent={(item.count / (stats.typeStats?.reduce((s, a) => s + a.count, 0) || 1)) * 100} size="small" />
                          }
                        />
                        <div>{item.count} actions</div>
                      </List.Item>
                    );
                  }}
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
              <Form.Item label="Search Activities" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="Search by description, action, user..."
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
              <Form.Item label="Activity Type" style={{ marginBottom: 0 }}>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                >
                  <Select.Option value="all">All Types</Select.Option>
                  <Select.Option value="auth">Authentication</Select.Option>
                  <Select.Option value="file">File</Select.Option>
                  <Select.Option value="user">User</Select.Option>
                  <Select.Option value="system">System</Select.Option>
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

      {/* Activities View */}
      <Card loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredActivities}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: currentPage,
            pageSize,
            onChange: setCurrentPage,
            showTotal: (total) => `Total ${total} activities`,
            showSizeChanger: false
          }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="No activities found" /> }}
        />
      </Card>

      {/* Activity Details Drawer */}
      <Drawer
        title={
          selectedActivity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getActivityTypeInfo(selectedActivity.activityType).icon}
              <span>Activity Details</span>
            </div>
          )
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={500}
      >
        {selectedActivity && (
          <Collapse
            items={[
              {
                key: '1',
                label: 'General Information',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>TYPE</div>
                      <Tag color={getActivityTypeInfo(selectedActivity.activityType).color}>
                        {getActivityTypeInfo(selectedActivity.activityType).label}
                      </Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>ACTION</div>
                      <Tag color="default">{selectedActivity.action}</Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>DESCRIPTION</div>
                      <div>{selectedActivity.description}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>USER</div>
                      <div>
                        {selectedActivity.user ? (
                          <Space>
                            <Avatar icon={<UserOutlined />} />
                            <div>
                              <div>{selectedActivity.user.name}</div>
                              <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{selectedActivity.user.email}</div>
                            </div>
                          </Space>
                        ) : (
                          <span style={{ color: '#8c8c8c' }}>System</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>TIMESTAMP</div>
                      <div>{dayjs(selectedActivity.timestamp).format('DD/MM/YYYY HH:mm:ss')}</div>
                    </div>
                  </div>
                )
              },
              {
                key: '2',
                label: 'Request Information',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>METHOD</div>
                      <Tag color="blue">{selectedActivity.method}</Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>PATH</div>
                      <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '12px' }}>
                        {selectedActivity.path}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>STATUS CODE</div>
                      <Tag
                        color={
                          selectedActivity.statusCode >= 200 && selectedActivity.statusCode < 300
                            ? 'green'
                            : selectedActivity.statusCode >= 400 && selectedActivity.statusCode < 500
                            ? 'orange'
                            : 'red'
                        }
                      >
                        {selectedActivity.statusCode}
                      </Tag>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>IP ADDRESS</div>
                      <div style={{ fontFamily: 'monospace' }}>{selectedActivity.ipAddress}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>USER AGENT</div>
                      <div style={{ fontSize: '12px', wordBreak: 'break-word', color: '#595959' }}>
                        {selectedActivity.userAgent}
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
                      <div>{selectedActivity.location?.city}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>COUNTRY</div>
                      <div>{selectedActivity.location?.country}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#8c8c8c', fontSize: '12px' }}>COORDINATES</div>
                      <div style={{ fontFamily: 'monospace' }}>
                        {selectedActivity.location?.latitude}, {selectedActivity.location?.longitude}
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
                    {JSON.stringify(selectedActivity.data, null, 2)}
                  </pre>
                )
              }
            ]}
          />
        )}
      </Drawer>
      </div>
    </Sidebar>
  );
};

export default ActivitiesLog;

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Checkbox,
  Space,
  Select,
  Tag,
  Modal,
  message,
  Alert,
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  UnorderedListOutlined,
  UserOutlined,
  UnlockOutlined,
  UserAddOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/useTicketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { storage } from '../services/storage';
import {
  Ticket,
  TicketType,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_COLORS,
} from '../types';
import { StatusBadge, PriorityBadge, TypeBadge } from '../components/Ticket/StatusBadge';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const BatchProcess: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tickets, fetchTickets, batchResetPassword, batchAssign, batchClose } = useTicketStore();
  const { addNotification } = useNotificationStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filterType, setFilterType] = useState<TicketType | 'all'>('all');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [batchAction, setBatchAction] = useState<'resetPassword' | 'assign' | 'close' | null>(null);
  const [assignEngineer, setAssignEngineer] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets({ status: 'pending' });
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    if (filterType === 'all') return tickets;
    return tickets.filter(t => t.type === filterType);
  }, [tickets, filterType]);

  const selectedTickets = useMemo(() => {
    return filteredTickets.filter(t => selectedRowKeys.includes(t.id));
  }, [filteredTickets, selectedRowKeys]);

  const engineers = useMemo(() => {
    return storage.getUsers().filter(u => u.role === 'engineer' || u.role === 'admin');
  }, []);

  const passwordResetTickets = useMemo(() => {
    return filteredTickets.filter(t =>
      t.title.includes('密码') ||
      t.title.includes('账号') ||
      t.title.includes('登录') ||
      t.description.includes('密码') ||
      t.description.includes('账号') ||
      t.description.includes('登录')
    );
  }, [filteredTickets]);

  const canResetPassword = selectedTickets.length > 0 && selectedTickets.every(t =>
    t.title.includes('密码') || t.title.includes('账号') || t.title.includes('登录')
  );

  const handleBatchResetPassword = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要处理的工单');
      return;
    }
    setBatchAction('resetPassword');
    setConfirmModalVisible(true);
  };

  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要处理的工单');
      return;
    }
    if (!assignEngineer) {
      message.warning('请选择要分配的工程师');
      return;
    }
    setBatchAction('assign');
    setConfirmModalVisible(true);
  };

  const handleBatchClose = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要处理的工单');
      return;
    }
    setBatchAction('close');
    setConfirmModalVisible(true);
  };

  const executeBatchAction = async () => {
    setLoading(true);
    try {
      let result: { success: number; failed: number } | null = null;

      if (batchAction === 'resetPassword') {
        result = batchResetPassword(selectedRowKeys as string[]);
        message.success(`批量重置密码成功：${result.success} 个成功，${result.failed} 个失败`);
      } else if (batchAction === 'assign') {
        const engineer = engineers.find(e => e.id === assignEngineer);
        if (engineer) {
          result = batchAssign(selectedRowKeys as string[], engineer.id, engineer.name);
          selectedTickets.forEach(ticket => {
            addNotification({
              userId: ticket.creatorId,
              title: '工单已分派',
              content: `您的工单 #${ticket.id} ${ticket.title} 已分派给 ${engineer.name} 处理`,
              type: 'ticket',
              ticketId: ticket.id,
            });
          });
          message.success(`批量分配成功：${result.success} 个成功，${result.failed} 个失败`);
        }
      } else if (batchAction === 'close') {
        result = batchClose(selectedRowKeys as string[]);
        message.success(`批量关闭成功：${result.success} 个成功，${result.failed} 个失败`);
      }

      setSelectedRowKeys([]);
      setConfirmModalVisible(false);
      setBatchAction(null);
      fetchTickets({ status: 'pending' });
    } catch (error) {
      message.error('批量操作失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <span className="font-mono text-blue-600">#{id}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => <span className="font-medium">{title}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: TicketType) => <TypeBadge type={type} />,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: any) => <PriorityBadge priority={priority} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: any) => <StatusBadge status={status} />,
    },
    {
      title: '提交人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Ticket) => (
        <Button type="link" onClick={() => navigate(`/tickets/${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  if (!user || (user.role !== 'engineer' && user.role !== 'admin')) {
    return (
      <Card>
        <Alert type="error" message="无权限访问" description="只有工程师和管理员可以访问批量处理页面" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')}>
          返回列表
        </Button>
        <div>
          <Title level={3} className="!m-0">
            批量处理
          </Title>
          <p className="text-gray-500 text-sm m-0">
            选择多个工单执行批量操作，提高处理效率
          </p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="border-0 shadow-sm">
            <Statistic
              title="待处理工单"
              value={tickets.length}
              prefix={<UnorderedListOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-0 shadow-sm">
            <Statistic
              title="已选择"
              value={selectedRowKeys.length}
              prefix={<CheckCircleOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-0 shadow-sm">
            <Statistic
              title="可批量重置密码"
              value={passwordResetTickets.length}
              prefix={<UnlockOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="border-0 shadow-sm"
        title={
          <div className="flex items-center gap-4">
            <span>批量操作</span>
            <Select
              placeholder="筛选类型"
              value={filterType}
              onChange={setFilterType}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="all">全部类型</Option>
              {Object.entries(TICKET_TYPE_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchTickets({ status: 'pending' })}
            >
              刷新
            </Button>
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<UnlockOutlined />}
              onClick={handleBatchResetPassword}
              disabled={!canResetPassword}
              className="bg-gradient-to-r from-purple-500 to-purple-600 border-0"
            >
              批量重置密码
            </Button>
            <div className="inline-flex items-center gap-2">
              <Select
                placeholder="选择工程师"
                value={assignEngineer}
                onChange={setAssignEngineer}
                style={{ width: 150 }}
              >
                {engineers.map(engineer => (
                  <Option key={engineer.id} value={engineer.id}>
                    {engineer.name}
                  </Option>
                ))}
              </Select>
              <Button
                icon={<UserAddOutlined />}
                onClick={handleBatchAssign}
                disabled={selectedRowKeys.length === 0}
              >
                批量分配
              </Button>
            </div>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleBatchClose}
              disabled={selectedRowKeys.length === 0}
            >
              批量关闭
            </Button>
          </Space>
        }
      >
        {selectedRowKeys.length > 0 && (
          <Alert
            message={`已选择 ${selectedRowKeys.length} 个工单，请选择批量操作`}
            type="info"
            showIcon
            className="mb-4"
          />
        )}
        
        {passwordResetTickets.length > 0 && (
          <Alert
            message={
              <div className="flex items-center gap-2">
                <UnlockOutlined className="text-purple-500" />
                <span>
                  检测到 {passwordResetTickets.length} 个密码/账号相关工单，可以使用"批量重置密码"功能一键处理
                </span>
              </div>
            }
            type="success"
            showIcon
            className="mb-4"
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => setSelectedRowKeys(passwordResetTickets.map(t => t.id))}
              >
                全选并重置
              </Button>
            }
          />
        )}

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="确认批量操作"
        open={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false);
          setBatchAction(null);
        }}
        footer={null}
      >
        <div className="space-y-4">
          <Alert
            message={
              batchAction === 'resetPassword'
                ? `即将批量重置 ${selectedRowKeys.length} 个工单的密码`
                : batchAction === 'assign'
                ? `即将批量分配 ${selectedRowKeys.length} 个工单给 ${engineers.find(e => e.id === assignEngineer)?.name}`
                : `即将批量关闭 ${selectedRowKeys.length} 个工单`
            }
            description="此操作将同时更新所有选中工单的状态，并通知相关人员。"
            type="warning"
            showIcon
          />
          
          <div>
            <Text type="secondary" className="text-sm block mb-2">
              涉及工单：
            </Text>
            <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-50 p-3 rounded-lg">
              {selectedTickets.map(ticket => (
                <div key={ticket.id} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-blue-600">#{ticket.id}</span>
                  <TypeBadge type={ticket.type} />
                  <span className="truncate">{ticket.title}</span>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setConfirmModalVisible(false);
                setBatchAction(null);
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              danger={batchAction === 'close'}
              onClick={executeBatchAction}
              loading={loading}
              icon={
                batchAction === 'resetPassword' ? <UnlockOutlined /> :
                batchAction === 'assign' ? <UserAddOutlined /> : <StopOutlined />
              }
            >
              确认{batchAction === 'resetPassword' ? '重置密码' : batchAction === 'assign' ? '分配' : '关闭'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BatchProcess;

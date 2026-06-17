import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Descriptions,
  Modal,
  Form,
  Input,
  message,
  Divider,
  Empty,
  Row,
  Col,
  Avatar,
  Steps,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicketStore } from '../store/useTicketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import ChatWindow from '../components/Ticket/ChatWindow';
import {
  StatusBadge,
  PriorityBadge,
  TypeBadge,
} from '../components/Ticket/StatusBadge';
import { Ticket, TicketStatus, TicketPriority, TicketType, TicketActionLog, TICKET_ACTION_LABELS, TICKET_ACTION_COLORS, TICKET_STATUS_LABELS } from '../types';
import dayjs from 'dayjs';
import { storage } from '../services/storage';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getTicket, claimTicket, assignTicket, resolveTicket, closeTicket, addMessage, getActionLogs } = useTicketStore();
  const { addNotification } = useNotificationStore();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [resolveForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [messages, setMessages] = useState(ticket?.messages || []);
  const [actionLogs, setActionLogs] = useState<TicketActionLog[]>([]);

  const loadTicket = useCallback(() => {
    if (id) {
      const t = getTicket(id);
      if (t) {
        setTicket(t);
        const msgs = storage.getMessagesByTicketId(id);
        setMessages(msgs);
        const logs = getActionLogs(id);
        setActionLogs(logs);
      } else {
        message.error('工单不存在');
        navigate('/tickets');
      }
    }
  }, [id, getTicket, getActionLogs, navigate]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleClaim = async () => {
    if (!ticket || !user) return;
    setLoading(true);
    try {
      const updated = claimTicket(ticket.id, user.id, user.name, user.id, user.name, user.role);
      if (updated) {
        setTicket(updated);
        message.success('已认领该工单');
        loadTicket();
        addNotification({
          userId: ticket.creatorId,
          title: '工单状态更新',
          content: `您的工单 #${ticket.id} ${ticket.title} 已被 ${user.name} 认领，正在处理中`,
          type: 'ticket',
          ticketId: ticket.id,
        });
      }
    } catch (error) {
      message.error('认领失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (values: { resolution: string }) => {
    if (!ticket || !user) return;
    setLoading(true);
    try {
      const updated = resolveTicket(ticket.id, values.resolution, user.id, user.name, user.role);
      if (updated) {
        setTicket(updated);
        message.success('工单已解决');
        setResolveModalVisible(false);
        resolveForm.resetFields();
        loadTicket();
        addNotification({
          userId: ticket.creatorId,
          title: '工单已解决',
          content: `您的工单 #${ticket.id} ${ticket.title} 已解决，请确认`,
          type: 'ticket',
          ticketId: ticket.id,
        });
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (values: { rating?: number; comment?: string }) => {
    if (!ticket || !user) return;
    setLoading(true);
    try {
      const updated = closeTicket(ticket.id, values.rating, values.comment);
      if (updated) {
        setTicket(updated);
        message.success('工单已关闭');
        setCloseModalVisible(false);
        closeForm.resetFields();
        loadTicket();
        if (ticket.assigneeId) {
          addNotification({
            userId: ticket.assigneeId,
            title: '工单已关闭',
            content: `工单 #${ticket.id} ${ticket.title} 已被 ${user.name} 关闭`,
            type: 'ticket',
            ticketId: ticket.id,
          });
        }
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'file' = 'text', attachment?: any) => {
    if (!ticket || !user) return;
    
    const msg = addMessage(ticket.id, {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content,
      type,
      attachment: attachment ? {
        ...attachment,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
        id: 'att_' + Date.now(),
      } : undefined,
    });

    if (msg) {
      loadTicket();
      
      const receiverId = user.id === ticket.creatorId ? ticket.assigneeId : ticket.creatorId;
      if (receiverId) {
        addNotification({
          userId: receiverId,
          title: '工单有新消息',
          content: `工单 #${ticket.id} ${ticket.title} 收到来自 ${user.name} 的新消息`,
          type: 'ticket',
          ticketId: ticket.id,
        });
      }
    }
  };

  const getStatusSteps = () => {
    if (!ticket) return [];
    const statusOrder: TicketStatus[] = ['pending', 'assigned', 'processing', 'resolved', 'closed'];
    const currentIndex = statusOrder.indexOf(ticket.status);
    
    const steps = [
      { title: '待处理', icon: <ClockCircleOutlined />, status: 'wait' as const },
      { title: '已分派', icon: <UserAddOutlined />, status: 'wait' as const },
      { title: '处理中', icon: <PlayCircleOutlined />, status: 'wait' as const },
      { title: '已解决', icon: <CheckCircleOutlined />, status: 'wait' as const },
      { title: '已关闭', icon: <StopOutlined />, status: 'wait' as const },
    ];
    
    return steps.map((step, index) => {
      let status: 'wait' | 'process' | 'finish' = 'wait';
      if (index < currentIndex) status = 'finish';
      else if (index === currentIndex) status = 'process';
      return { ...step, status };
    });
  };

  const canClaim = ticket?.status === 'pending' && (user?.role === 'engineer' || user?.role === 'admin');
  const canResolve = ticket?.status === 'processing' && (ticket.assigneeId === user?.id || user?.role === 'admin');
  const canClose = ticket?.status === 'resolved' && (ticket.creatorId === user?.id || user?.role === 'admin');
  const isChatDisabled = ticket?.status === 'closed';

  if (!ticket) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/tickets')}
        >
          返回列表
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Title level={3} className="!m-0">
              #{ticket.id} {ticket.title}
            </Title>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <TypeBadge type={ticket.type} />
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <Text type="secondary" className="text-sm">
              创建于 {dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}
            </Text>
          </div>
        </div>
        <Space>
          {canClaim && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleClaim}
              loading={loading}
            >
              认领工单
            </Button>
          )}
          {canResolve && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setResolveModalVisible(true)}
            >
              标记解决
            </Button>
          )}
          {canClose && (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={() => setCloseModalVisible(true)}
            >
              关闭工单
            </Button>
          )}
        </Space>
      </div>

      <Card className="border-0 shadow-sm">
        <Steps
          current={getStatusSteps().findIndex(s => s.status === 'process')}
          items={getStatusSteps()}
          size="small"
          className="mb-6"
        />
      </Card>

      <Card title="处理记录" className="border-0 shadow-sm">
        {actionLogs.length === 0 ? (
          <Empty description="暂无处理记录" />
        ) : (
          <div className="relative pl-8">
            {actionLogs.map((log, index) => (
              <div key={log.id} className="relative pb-6 last:pb-0">
                {index < actionLogs.length - 1 && (
                  <div className="absolute left-[-24px] top-6 w-0.5 h-full bg-gray-200"></div>
                )}
                <div className="absolute left-[-28px] top-0 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 z-10">
                  <div className={`w-3 h-3 rounded-full ${
                    log.action === 'created' ? 'bg-blue-500' :
                    log.action === 'claimed' ? 'bg-cyan-500' :
                    log.action === 'assigned' ? 'bg-purple-500' :
                    log.action === 'resolved' ? 'bg-green-500' :
                    log.action === 'closed' ? 'bg-gray-500' :
                    log.action === 'batch_processed' ? 'bg-geekblue-500' :
                    'bg-blue-400'
                  }`}></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag color={TICKET_ACTION_COLORS[log.action]}>
                        {TICKET_ACTION_LABELS[log.action]}
                      </Tag>
                      <span className="text-gray-600 font-medium">
                        {log.operatorName}
                      </span>
                      <Tag color={log.operatorRole === 'admin' ? 'red' : log.operatorRole === 'engineer' ? 'blue' : 'green'}>
                        {log.operatorRole === 'admin' ? '管理员' : log.operatorRole === 'engineer' ? '工程师' : '员工'}
                      </Tag>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  <p className="text-gray-700 m-0">
                    {log.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="工单信息" className="border-0 shadow-sm h-full">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="工单标题">{ticket.title}</Descriptions.Item>
              <Descriptions.Item label="问题描述">
                <div className="whitespace-pre-wrap">{ticket.description}</div>
              </Descriptions.Item>
              <Descriptions.Item label="问题类型">
                <TypeBadge type={ticket.type} />
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <PriorityBadge priority={ticket.priority} />
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <StatusBadge status={ticket.status} />
              </Descriptions.Item>
              <Descriptions.Item label="提交人">
                <div className="flex items-center gap-2">
                  <Avatar
                    size={24}
                    className="bg-gradient-to-br from-blue-400 to-blue-600"
                    icon={<UserOutlined />}
                  />
                  <span>{ticket.creatorName}</span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {ticket.assigneeName ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      size={24}
                      className="bg-gradient-to-br from-purple-500 to-blue-500"
                      icon={<UserOutlined />}
                    />
                    <span>{ticket.assigneeName}</span>
                  </div>
                ) : (
                  <Text type="secondary">暂未分配</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(ticket.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {ticket.resolvedAt && (
                <Descriptions.Item label="解决时间">
                  {dayjs(ticket.resolvedAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {ticket.closedAt && (
                <Descriptions.Item label="关闭时间">
                  {dayjs(ticket.closedAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="沟通记录" className="border-0 shadow-sm">
            <ChatWindow
              messages={messages}
              currentUser={user!}
              onSendMessage={handleSendMessage}
              disabled={isChatDisabled}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="标记工单已解决"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={null}
      >
        <Form form={resolveForm} onFinish={handleResolve} layout="vertical">
          <Form.Item
            name="resolution"
            label="解决方案"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <TextArea
              rows={4}
              placeholder="请描述解决方案和操作步骤..."
            />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setResolveModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认解决
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关闭工单"
        open={closeModalVisible}
        onCancel={() => setCloseModalVisible(false)}
        footer={null}
      >
        <Form form={closeForm} onFinish={handleClose} layout="vertical">
          <Form.Item
            name="rating"
            label="服务评价"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  type="text"
                  className="text-2xl"
                  onClick={() => closeForm.setFieldValue('rating', star)}
                >
                  {star} ⭐
                </Button>
              ))}
            </div>
          </Form.Item>
          <Form.Item name="comment" label="评价内容">
            <TextArea rows={3} placeholder="请输入您的评价（选填）..." />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setCloseModalVisible(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit" loading={loading}>
                确认关闭
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TicketDetail;

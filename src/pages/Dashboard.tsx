import React, { useEffect, useMemo } from 'react';
import { Row, Col, Card, Statistic, Typography, Button, List, Tag, Empty } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusCircleOutlined,
  BookOutlined,
  ArrowRightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTicketStore } from '../store/useTicketStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { PriorityBadge, StatusBadge, TypeBadge } from '../components/Ticket/StatusBadge';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tickets, fetchTickets, loading } = useTicketStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchTickets();
    if (user) {
      fetchNotifications(user.id);
    }
  }, [fetchTickets, fetchNotifications, user]);

  const stats = useMemo(() => {
    const myTickets = user?.role === 'employee'
      ? tickets.filter(t => t.creatorId === user.id)
      : user?.role === 'engineer'
      ? tickets.filter(t => t.assigneeId === user.id)
      : tickets;

    return {
      total: myTickets.length,
      pending: myTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length,
      processing: myTickets.filter(t => t.status === 'processing').length,
      resolved: myTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    };
  }, [tickets, user]);

  const urgentTickets = useMemo(() => {
    return tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').slice(0, 5);
  }, [tickets]);

  const myPendingTickets = useMemo(() => {
    if (!user) return [];
    if (user.role === 'employee') {
      return tickets.filter(t => t.creatorId === user.id && t.status !== 'closed').slice(0, 5);
    }
    return tickets.filter(t => t.assigneeId === user.id && t.status !== 'closed').slice(0, 5);
  }, [tickets, user]);

  const recentNotifications = useMemo(() => {
    return notifications.filter(n => !n.read).slice(0, 5);
  }, [notifications]);

  const StatCard = ({ icon, title, value, color, onClick }: any) => (
    <Card
      className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 border-0"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <Text type="secondary" className="text-sm">{title}</Text>
          <Statistic value={value} className="!mt-2" />
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            欢迎回来，{user?.name}
          </Title>
          <Text type="secondary">
            {dayjs().format('YYYY年MM月DD日 dddd')} · 祝您工作顺利
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusCircleOutlined />}
          onClick={() => navigate('/tickets/create')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg h-10 px-6"
        >
          提交工单
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<FileTextOutlined className="text-2xl text-blue-500" />}
            title="全部工单"
            value={stats.total}
            color="bg-blue-50"
            onClick={() => navigate('/tickets')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ClockCircleOutlined className="text-2xl text-orange-500" />}
            title="待处理"
            value={stats.pending}
            color="bg-orange-50"
            onClick={() => navigate('/tickets?status=pending')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<WarningOutlined className="text-2xl text-red-500" />}
            title="处理中"
            value={stats.processing}
            color="bg-red-50"
            onClick={() => navigate('/tickets?status=processing')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined className="text-2xl text-green-500" />}
            title="已解决"
            value={stats.resolved}
            color="bg-green-50"
            onClick={() => navigate('/tickets?status=resolved')}
          />
        </Col>
      </Row>

      {urgentTickets.length > 0 && (
        <Card
          className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
          title={
            <div className="flex items-center gap-2 text-red-600">
              <WarningOutlined className="animate-pulse" />
              <span>紧急工单提醒</span>
              <Tag color="red" className="ml-2">{urgentTickets.length} 条</Tag>
            </div>
          }
          extra={
            <Button type="link" onClick={() => navigate('/tickets?priority=urgent')}>
              查看全部 <ArrowRightOutlined />
            </Button>
          }
        >
          <List
            dataSource={urgentTickets}
            renderItem={(ticket) => (
              <List.Item
                key={ticket.id}
                className="cursor-pointer hover:bg-white/50 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <PriorityBadge priority={ticket.priority} />
                    <span className="font-medium truncate">{ticket.title}</span>
                  </div>
                  <Text type="secondary" className="text-xs shrink-0 ml-2">
                    {dayjs(ticket.createdAt).fromNow()}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <FileTextOutlined className="text-blue-500" />
                <span>
                  {user?.role === 'employee' ? '我的工单' : '待处理工单'}
                </span>
              </div>
            }
            extra={
              <Button type="link" onClick={() => navigate('/tickets')}>
                全部工单 <ArrowRightOutlined />
              </Button>
            }
          >
            {myPendingTickets.length === 0 ? (
              <Empty description="暂无相关工单" />
            ) : (
              <List
                dataSource={myPendingTickets}
                renderItem={(ticket) => (
                  <List.Item
                    key={ticket.id}
                    className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <TypeBadge type={ticket.type} />
                        <StatusBadge status={ticket.status} />
                        <span className="font-medium truncate">{ticket.title}</span>
                      </div>
                      <Text type="secondary" className="text-xs shrink-0">
                        {dayjs(ticket.createdAt).format('MM-DD HH:mm')}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <BookOutlined className="text-purple-500" />
                <span>快捷操作</span>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="text"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 rounded-xl border border-gray-100"
                onClick={() => navigate('/tickets/create')}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xl shadow-md">
                  <PlusCircleOutlined />
                </div>
                <span className="text-sm font-medium">提交新工单</span>
              </Button>

              <Button
                type="text"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 rounded-xl border border-gray-100"
                onClick={() => navigate('/faq')}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white text-xl shadow-md">
                  <BookOutlined />
                </div>
                <span className="text-sm font-medium">FAQ知识库</span>
              </Button>

              <Button
                type="text"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 rounded-xl border border-gray-100"
                onClick={() => navigate('/notifications')}
              >
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white text-xl shadow-md relative">
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                  <UserOutlined />
                </div>
                <span className="text-sm font-medium">通知中心</span>
              </Button>

              <Button
                type="text"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 rounded-xl border border-gray-100"
                onClick={() => navigate('/profile')}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xl shadow-md">
                  <UserOutlined />
                </div>
                <span className="text-sm font-medium">个人中心</span>
              </Button>
            </div>

            {recentNotifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Text type="secondary" className="text-sm mb-2 block">最新通知</Text>
                <List
                  size="small"
                  dataSource={recentNotifications}
                  renderItem={(notification) => (
                    <List.Item
                      key={notification.id}
                      className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                      onClick={() => {
                        if (notification.ticketId) {
                          navigate(`/tickets/${notification.ticketId}`);
                        } else {
                          navigate('/notifications');
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>
                        <span className="text-sm truncate">{notification.title}</span>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

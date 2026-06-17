import React, { useEffect, useMemo } from 'react';
import { Card, Avatar, Descriptions, Statistic, Row, Col, List, Tag, Button } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { useTicketStore } from '../store/useTicketStore';
import { TICKET_TYPE_LABELS, TICKET_TYPE_COLORS, TICKET_STATUS_COLORS, TICKET_STATUS_LABELS } from '../types';
import MainLayout from '../components/Layout/MainLayout';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const { tickets, fetchTickets } = useTicketStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const myTickets = useMemo(() => {
    if (!user) return [];
    if (user.role === 'employee') {
      return tickets.filter((t) => t.creatorId === user.id);
    } else {
      return tickets.filter((t) => t.assigneeId === user.id || t.creatorId === user.id);
    }
  }, [tickets, user]);

  const stats = useMemo(() => {
    const total = myTickets.length;
    const pending = myTickets.filter((t) => t.status === 'pending').length;
    const processing = myTickets.filter((t) => t.status === 'processing').length;
    const resolved = myTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    return { total, pending, processing, resolved };
  }, [myTickets]);

  const recentTickets = useMemo(() => {
    return [...myTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [myTickets]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '系统管理员';
      case 'engineer':
        return 'IT工程师';
      default:
        return '员工';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'engineer':
        return 'blue';
      default:
        return 'green';
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">请先登录</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="shadow-sm border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 -m-6 mb-6 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar
                size={100}
                icon={<UserOutlined />}
                className="bg-white/20 border-4 border-white/30"
              />
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <Tag color={getRoleColor(user.role)} className="text-sm">
                    {getRoleLabel(user.role)}
                  </Tag>
                  <span className="text-blue-100 flex items-center gap-1">
                    <TeamOutlined /> {user.department}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Descriptions column={{ xs: 1, md: 2, lg: 3 }}>
            <Descriptions.Item label="用户名" labelStyle={{ fontWeight: 600 }}>
              {user.username}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱" labelStyle={{ fontWeight: 600 }}>
              <span className="flex items-center gap-2">
                <MailOutlined className="text-blue-500" />
                {user.email}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="用户ID" labelStyle={{ fontWeight: 600 }}>
              {user.id}
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-6 flex justify-end">
            <Button icon={<SettingOutlined />}>编辑资料</Button>
          </div>
        </Card>

        <Row gutter={16}>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileTextOutlined className="text-xl text-blue-500" />
              </div>
              <Statistic title="我的工单" value={stats.total} valueStyle={{ color: '#3b82f6' }} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClockCircleOutlined className="text-xl text-yellow-500" />
              </div>
              <Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#f59e0b' }} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClockCircleOutlined className="text-xl text-cyan-500" />
              </div>
              <Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#06b6d4' }} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleOutlined className="text-xl text-green-500" />
              </div>
              <Statistic title="已解决" value={stats.resolved} valueStyle={{ color: '#22c55e' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title="最近工单"
          className="shadow-sm border-0"
          extra={
            <Button type="link" onClick={() => navigate('/tickets')}>
              查看全部
            </Button>
          }
        >
          {recentTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileTextOutlined className="text-4xl mb-3" />
              <p>暂无工单</p>
            </div>
          ) : (
            <List
              dataSource={recentTickets}
              renderItem={(ticket) => (
                <List.Item
                  key={ticket.id}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg px-3 transition-colors"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{ticket.title}</span>
                        <Tag color={TICKET_TYPE_COLORS[ticket.type]}>
                          {TICKET_TYPE_LABELS[ticket.type]}
                        </Tag>
                        <Tag color={TICKET_STATUS_COLORS[ticket.status]}>
                          {TICKET_STATUS_LABELS[ticket.status]}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>工单号: #{ticket.id}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {ticket.assigneeName && <span>处理人: {ticket.assigneeName}</span>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default Profile;

import React from 'react';
import { Card, Avatar, Space, Typography } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Ticket } from '../../types';
import { StatusBadge, PriorityBadge, TypeBadge } from './StatusBadge';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface TicketCardProps {
  ticket: Ticket;
  showActions?: boolean;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, showActions = true }) => {
  const navigate = useNavigate();
  const isUrgent = ticket.priority === 'urgent';

  return (
    <Card
      className={`w-full hover:shadow-lg transition-all duration-300 cursor-pointer mb-4 ${
        isUrgent ? 'border-l-4 border-l-red-500 animate-pulse' : 'border-l-4 border-l-transparent hover:border-l-blue-500'
      }`}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      hoverable
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <PriorityBadge priority={ticket.priority} />
            <TypeBadge type={ticket.type} />
            <StatusBadge status={ticket.status} />
          </div>
          <Title level={5} className="!mb-1 !text-base truncate">
            {ticket.title}
          </Title>
          <Text type="secondary" className="text-sm line-clamp-2">
            {ticket.description}
          </Text>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 text-sm">
          <Space className="flex-wrap">
            <Avatar
              size={28}
              className="bg-gradient-to-br from-blue-400 to-blue-600"
              icon={<UserOutlined />}
            />
            <div className="flex flex-col">
              <Text strong className="text-xs">
                {ticket.creatorName}
              </Text>
              {ticket.assigneeName && (
                <Text type="secondary" className="text-xs">
                  处理人：{ticket.assigneeName}
                </Text>
              )}
            </div>
          </Space>

          <div className="flex items-center gap-1 text-gray-400">
            <ClockCircleOutlined />
            <Text type="secondary" className="text-xs">
              {dayjs(ticket.createdAt).format('MM-DD HH:mm')}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TicketCard;

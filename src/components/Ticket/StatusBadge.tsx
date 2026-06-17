import React from 'react';
import { Tag } from 'antd';
import {
  TicketStatus,
  TicketPriority,
  TicketType,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_COLORS,
  TICKET_TYPE_COLORS,
} from '../../types';

interface StatusBadgeProps {
  status: TicketStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <Tag color={TICKET_STATUS_COLORS[status]} className="m-0">
      {TICKET_STATUS_LABELS[status]}
    </Tag>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const isUrgent = priority === 'urgent';
  return (
    <Tag
      color={TICKET_PRIORITY_COLORS[priority]}
      className={`m-0 ${isUrgent ? 'animate-pulse' : ''}`}
    >
      {TICKET_PRIORITY_LABELS[priority]}
    </Tag>
  );
};

interface TypeBadgeProps {
  type: TicketType;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  return (
    <Tag color={TICKET_TYPE_COLORS[type]} className="m-0">
      {TICKET_TYPE_LABELS[type]}
    </Tag>
  );
};

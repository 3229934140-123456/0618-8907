export type UserRole = 'employee' | 'engineer' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
}

export type TicketType = 'hardware' | 'software' | 'permission' | 'network';
export type TicketStatus = 'pending' | 'assigned' | 'processing' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: 'text' | 'image' | 'file';
  attachment?: Attachment;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  creatorId: string;
  creatorName: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  messages: Message[];
  attachments: Attachment[];
}

export interface FAQ {
  id: string;
  title: string;
  content: string;
  type: TicketType;
  tags: string[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'ticket' | 'system' | 'urgent';
  ticketId?: string;
  read: boolean;
  createdAt: string;
}

export interface Statistics {
  totalTickets: number;
  pendingTickets: number;
  processingTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  ticketsByType: Record<TicketType, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByStatus: Record<TicketStatus, number>;
  frequentIssues: { title: string; count: number }[];
  resolutionTrend: { date: string; count: number }[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  hardware: '硬件',
  software: '软件',
  permission: '权限',
  network: '网络',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending: '待处理',
  assigned: '已分派',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const TICKET_TYPE_COLORS: Record<TicketType, string> = {
  hardware: 'geekblue',
  software: 'purple',
  permission: 'cyan',
  network: 'orange',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  pending: 'default',
  assigned: 'blue',
  processing: 'processing',
  resolved: 'success',
  closed: 'default',
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

import { create } from 'zustand';
import { Ticket, TicketType, TicketStatus, TicketPriority, Message, TicketActionLog, TicketActionType } from '../types';
import { storage } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';

interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  fetchTickets: (filters?: {
    status?: TicketStatus;
    type?: TicketType;
    priority?: TicketPriority;
    keyword?: string;
  }) => void;
  getTicket: (id: string) => Ticket | undefined;
  createTicket: (data: {
    title: string;
    description: string;
    type: TicketType;
    priority: TicketPriority;
    creatorId: string;
    creatorName: string;
  }) => Ticket;
  updateTicket: (id: string, updates: Partial<Ticket>) => Ticket | undefined;
  claimTicket: (id: string, assigneeId: string, assigneeName: string, operatorId: string, operatorName: string, operatorRole: string) => Ticket | undefined;
  assignTicket: (id: string, assigneeId: string, assigneeName: string, operatorId: string, operatorName: string, operatorRole: string) => Ticket | undefined;
  resolveTicket: (id: string, resolution: string, operatorId: string, operatorName: string, operatorRole: string) => Ticket | undefined;
  closeTicket: (id: string, operatorId: string, operatorName: string, operatorRole: string, rating?: number, comment?: string) => Ticket | undefined;
  addMessage: (ticketId: string, message: Omit<Message, 'id' | 'ticketId' | 'createdAt'>) => Message | undefined;
  batchResetPassword: (ticketIds: string[], operatorId: string, operatorName: string, operatorRole: string) => { success: number; failed: number };
  batchAssign: (ticketIds: string[], assigneeId: string, assigneeName: string, operatorId: string, operatorName: string, operatorRole: string) => { success: number; failed: number };
  batchClose: (ticketIds: string[], operatorId: string, operatorName: string, operatorRole: string) => { success: number; failed: number };
  addActionLog: (ticketId: string, action: TicketActionType, operatorId: string, operatorName: string, operatorRole: string, description: string, oldValue?: string, newValue?: string) => void;
  getActionLogs: (ticketId: string) => TicketActionLog[];
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  loading: false,

  fetchTickets: (filters) => {
    set({ loading: true });
    let tickets = storage.getTickets();

    if (filters) {
      if (filters.status) {
        tickets = tickets.filter(t => t.status === filters.status);
      }
      if (filters.type) {
        tickets = tickets.filter(t => t.type === filters.type);
      }
      if (filters.priority) {
        tickets = tickets.filter(t => t.priority === filters.priority);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        tickets = tickets.filter(t =>
          t.title.toLowerCase().includes(keyword) ||
          t.description.toLowerCase().includes(keyword)
        );
      }
    }

    set({ tickets, loading: false });
  },

  getTicket: (id) => {
    return storage.getTicketById(id);
  },

  addActionLog: (ticketId, action, operatorId, operatorName, operatorRole, description, oldValue, newValue) => {
    const log: TicketActionLog = {
      id: uuidv4(),
      ticketId,
      action,
      operatorId,
      operatorName,
      operatorRole,
      description,
      oldValue,
      newValue,
      createdAt: new Date().toISOString(),
    };
    storage.addActionLog(log);
  },

  getActionLogs: (ticketId) => {
    return storage.getActionLogsByTicketId(ticketId);
  },

  createTicket: (data) => {
    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: uuidv4().slice(0, 8),
      title: data.title,
      description: data.description,
      type: data.type,
      status: 'pending',
      priority: data.priority,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      createdAt: now,
      updatedAt: now,
      messages: [],
      attachments: [],
      actionLogs: [],
    };
    storage.addTicket(ticket);
    
    get().addActionLog(
      ticket.id,
      'created',
      data.creatorId,
      data.creatorName,
      'employee',
      `${data.creatorName}提交了工单`
    );
    
    get().fetchTickets();
    return ticket;
  },

  updateTicket: (id, updates) => {
    const ticket = storage.getTicketById(id);
    if (ticket) {
      const updated = { ...ticket, ...updates, updatedAt: new Date().toISOString() };
      storage.updateTicket(updated);
      get().fetchTickets();
      return updated;
    }
    return undefined;
  },

  claimTicket: (id, assigneeId, assigneeName, operatorId, operatorName, operatorRole) => {
    const result = get().updateTicket(id, {
      assigneeId,
      assigneeName,
      status: 'processing',
    });
    if (result) {
      get().addActionLog(
        id,
        'claimed',
        operatorId,
        operatorName,
        operatorRole,
        `${operatorName}认领了工单`
      );
    }
    return result;
  },

  assignTicket: (id, assigneeId, assigneeName, operatorId, operatorName, operatorRole) => {
    const result = get().updateTicket(id, {
      assigneeId,
      assigneeName,
      status: 'assigned',
    });
    if (result) {
      get().addActionLog(
        id,
        'assigned',
        operatorId,
        operatorName,
        operatorRole,
        `${operatorName}将工单分派给${assigneeName}`
      );
    }
    return result;
  },

  resolveTicket: (id, resolution, operatorId, operatorName, operatorRole) => {
    const result = get().updateTicket(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
    if (result) {
      get().addActionLog(
        id,
        'resolved',
        operatorId,
        operatorName,
        operatorRole,
        `${operatorName}标记工单已解决：${resolution}`
      );
    }
    return result;
  },

  closeTicket: (id, operatorId, operatorName, operatorRole, rating, comment) => {
    const ticket = storage.getTicketById(id);
    const result = get().updateTicket(id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
    });
    if (result && ticket) {
      get().addActionLog(
        id,
        'closed',
        operatorId,
        operatorName,
        operatorRole,
        `${operatorName}确认问题已解决，关闭工单`
      );
    }
    return result;
  },

  addMessage: (ticketId, messageData) => {
    const ticket = storage.getTicketById(ticketId);
    if (ticket) {
      const message: Message = {
        id: uuidv4(),
        ticketId,
        ...messageData,
        createdAt: new Date().toISOString(),
      };
      storage.addMessage(message);
      
      const updatedMessages = [...ticket.messages, message];
      storage.updateTicket({ ...ticket, messages: updatedMessages });
      
      if (messageData.type === 'text') {
        get().addActionLog(
          ticketId,
          'message_sent',
          messageData.senderId,
          messageData.senderName,
          messageData.senderRole,
          `${messageData.senderName}发送了消息`
        );
      } else if (messageData.type === 'image' || messageData.type === 'file') {
        get().addActionLog(
          ticketId,
          'attachment_uploaded',
          messageData.senderId,
          messageData.senderName,
          messageData.senderRole,
          `${messageData.senderName}上传了${messageData.type === 'image' ? '图片' : '文件'}`
        );
      }
      
      get().fetchTickets();
      return message;
    }
    return undefined;
  },

  batchResetPassword: (ticketIds, operatorId, operatorName, operatorRole) => {
    let success = 0;
    let failed = 0;
    const now = new Date().toISOString();
    ticketIds.forEach(id => {
      const result = get().updateTicket(id, {
        status: 'resolved',
        resolvedAt: now,
      });
      if (result) {
        get().addActionLog(
          id,
          'batch_processed',
          operatorId,
          operatorName,
          operatorRole,
          `${operatorName}通过批量处理重置了密码`
        );
        success++;
      } else {
        failed++;
      }
    });
    return { success, failed };
  },

  batchAssign: (ticketIds, assigneeId, assigneeName, operatorId, operatorName, operatorRole) => {
    let success = 0;
    let failed = 0;
    ticketIds.forEach(id => {
      const result = get().assignTicket(id, assigneeId, assigneeName, operatorId, operatorName, operatorRole);
      if (result) {
        get().addActionLog(
          id,
          'batch_processed',
          operatorId,
          operatorName,
          operatorRole,
          `${operatorName}通过批量处理将工单分派给${assigneeName}`
        );
        success++;
      } else {
        failed++;
      }
    });
    return { success, failed };
  },

  batchClose: (ticketIds, operatorId, operatorName, operatorRole) => {
    let success = 0;
    let failed = 0;
    ticketIds.forEach(id => {
      const ticket = storage.getTicketById(id);
      const result = get().updateTicket(id, {
        status: 'closed',
        closedAt: new Date().toISOString(),
      });
      if (result) {
        get().addActionLog(
          id,
          'batch_processed',
          operatorId,
          operatorName,
          operatorRole,
          `${operatorName}通过批量处理关闭了工单`
        );
        success++;
      } else {
        failed++;
      }
    });
    return { success, failed };
  },
}));

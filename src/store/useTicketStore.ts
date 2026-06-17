import { create } from 'zustand';
import { Ticket, TicketType, TicketStatus, TicketPriority, Message } from '../types';
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
  claimTicket: (id: string, assigneeId: string, assigneeName: string) => Ticket | undefined;
  assignTicket: (id: string, assigneeId: string, assigneeName: string) => Ticket | undefined;
  resolveTicket: (id: string, resolution: string) => Ticket | undefined;
  closeTicket: (id: string, rating?: number, comment?: string) => Ticket | undefined;
  addMessage: (ticketId: string, message: Omit<Message, 'id' | 'ticketId' | 'createdAt'>) => Message | undefined;
  batchResetPassword: (ticketIds: string[]) => { success: number; failed: number };
  batchAssign: (ticketIds: string[], assigneeId: string, assigneeName: string) => { success: number; failed: number };
  batchClose: (ticketIds: string[]) => { success: number; failed: number };
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
    };
    storage.addTicket(ticket);
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

  claimTicket: (id, assigneeId, assigneeName) => {
    return get().updateTicket(id, {
      assigneeId,
      assigneeName,
      status: 'processing',
    });
  },

  assignTicket: (id, assigneeId, assigneeName) => {
    return get().updateTicket(id, {
      assigneeId,
      assigneeName,
      status: 'assigned',
    });
  },

  resolveTicket: (id, resolution) => {
    return get().updateTicket(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
  },

  closeTicket: (id, rating, comment) => {
    return get().updateTicket(id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
    });
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
      get().fetchTickets();
      return message;
    }
    return undefined;
  },

  batchResetPassword: (ticketIds) => {
    let success = 0;
    let failed = 0;
    ticketIds.forEach(id => {
      const result = get().updateTicket(id, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      if (result) success++;
      else failed++;
    });
    return { success, failed };
  },

  batchAssign: (ticketIds, assigneeId, assigneeName) => {
    let success = 0;
    let failed = 0;
    ticketIds.forEach(id => {
      const result = get().assignTicket(id, assigneeId, assigneeName);
      if (result) success++;
      else failed++;
    });
    return { success, failed };
  },

  batchClose: (ticketIds) => {
    let success = 0;
    let failed = 0;
    ticketIds.forEach(id => {
      const result = get().closeTicket(id);
      if (result) success++;
      else failed++;
    });
    return { success, failed };
  },
}));

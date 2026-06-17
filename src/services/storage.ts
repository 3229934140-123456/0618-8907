import { Ticket, FAQ, Notification as NotificationType, User, Message, TicketActionLog } from '../types';
import { mockTickets, mockFAQs, mockNotifications, mockUsers, mockMessages, mockActionLogs } from '../mock/data';

const STORAGE_KEYS = {
  TICKETS: 'it_helpdesk_tickets',
  FAQS: 'it_helpdesk_faqs',
  NOTIFICATIONS: 'it_helpdesk_notifications',
  CURRENT_USER: 'it_helpdesk_current_user',
  USERS: 'it_helpdesk_users',
  MESSAGES: 'it_helpdesk_messages',
  ACTION_LOGS: 'it_helpdesk_action_logs',
};

export const storage = {
  initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(mockTickets));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAQS)) {
      localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(mockFAQs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(mockNotifications));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(mockMessages));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTION_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.ACTION_LOGS, JSON.stringify(mockActionLogs));
    }
  },

  getTickets(): Ticket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  },

  saveTickets(tickets: Ticket[]) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  getTicketById(id: string): Ticket | undefined {
    const tickets = this.getTickets();
    return tickets.find(t => t.id === id);
  },

  updateTicket(ticket: Ticket) {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === ticket.id);
    if (index !== -1) {
      tickets[index] = ticket;
      this.saveTickets(tickets);
    }
  },

  addTicket(ticket: Ticket) {
    const tickets = this.getTickets();
    tickets.unshift(ticket);
    this.saveTickets(tickets);
  },

  getFAQs(): FAQ[] {
    const data = localStorage.getItem(STORAGE_KEYS.FAQS);
    return data ? JSON.parse(data) : [];
  },

  saveFAQs(faqs: FAQ[]) {
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(faqs));
  },

  updateFAQ(faq: FAQ) {
    const faqs = this.getFAQs();
    const index = faqs.findIndex(f => f.id === faq.id);
    if (index !== -1) {
      faqs[index] = faq;
      this.saveFAQs(faqs);
    }
  },

  getNotifications(): NotificationType[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },

  saveNotifications(notifications: NotificationType[]) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  addNotification(notification: NotificationType) {
    const notifications = this.getNotifications();
    notifications.unshift(notification);
    this.saveNotifications(notifications);
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  getMessages(): Message[] {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return data ? JSON.parse(data) : [];
  },

  saveMessages(messages: Message[]) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  },

  addMessage(message: Message) {
    const messages = this.getMessages();
    messages.push(message);
    this.saveMessages(messages);
  },

  getMessagesByTicketId(ticketId: string): Message[] {
    const messages = this.getMessages();
    return messages.filter(m => m.ticketId === ticketId);
  },

  getActionLogs(): TicketActionLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACTION_LOGS);
    return data ? JSON.parse(data) : [];
  },

  saveActionLogs(logs: TicketActionLog[]) {
    localStorage.setItem(STORAGE_KEYS.ACTION_LOGS, JSON.stringify(logs));
  },

  addActionLog(log: TicketActionLog) {
    const logs = this.getActionLogs();
    logs.unshift(log);
    this.saveActionLogs(logs);
    
    const tickets = this.getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === log.ticketId);
    if (ticketIndex !== -1) {
      const ticket = tickets[ticketIndex];
      if (!ticket.actionLogs) {
        ticket.actionLogs = [];
      }
      ticket.actionLogs.unshift(log);
      this.saveTickets(tickets);
    }
  },

  getActionLogsByTicketId(ticketId: string): TicketActionLog[] {
    const logs = this.getActionLogs();
    return logs.filter(l => l.ticketId === ticketId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};

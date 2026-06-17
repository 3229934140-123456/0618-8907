import { create } from 'zustand';
import { Statistics, Ticket, TicketType, TicketStatus, TicketPriority } from '../types';
import { storage } from '../services/storage';
import { mockStatistics } from '../mock/data';

interface StatisticsState {
  statistics: Statistics;
  loading: boolean;
  fetchStatistics: (startDate?: string, endDate?: string) => void;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  statistics: mockStatistics,
  loading: false,

  fetchStatistics: (startDate, endDate) => {
    set({ loading: true });
    const tickets = storage.getTickets();
    
    let filteredTickets = tickets;
    if (startDate) {
      filteredTickets = filteredTickets.filter(t => t.createdAt >= startDate);
    }
    if (endDate) {
      filteredTickets = filteredTickets.filter(t => t.createdAt <= endDate);
    }

    const ticketsByType = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.type] = (acc[ticket.type] || 0) + 1;
      return acc;
    }, {} as Record<TicketType, number>);

    const ticketsByPriority = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<TicketPriority, number>);

    const ticketsByStatus = filteredTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<TicketStatus, number>);

    const typeLabels: Record<TicketType, string> = {
      hardware: '硬件问题',
      software: '软件问题',
      permission: '权限问题',
      network: '网络问题',
    };

    const frequentIssueMap = new Map<string, number>();
    filteredTickets.forEach(ticket => {
      const typeLabel = typeLabels[ticket.type];
      frequentIssueMap.set(typeLabel, (frequentIssueMap.get(typeLabel) || 0) + 1);
    });

    const frequentIssues = Array.from(frequentIssueMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const statistics: Statistics = {
      totalTickets: filteredTickets.length,
      pendingTickets: ticketsByStatus.pending || 0,
      processingTickets: ticketsByStatus.processing || 0,
      resolvedTickets: (ticketsByStatus.resolved || 0) + (ticketsByStatus.closed || 0),
      avgResponseTime: mockStatistics.avgResponseTime,
      avgResolutionTime: mockStatistics.avgResolutionTime,
      ticketsByType: {
        hardware: 0, software: 0, permission: 0, network: 0, ...ticketsByType },
      ticketsByPriority: {
        low: 0, medium: 0, high: 0, urgent: 0, ...ticketsByPriority },
      ticketsByStatus: {
        pending: 0, assigned: 0, processing: 0, resolved: 0, closed: 0, ...ticketsByStatus },
      frequentIssues: frequentIssues.length > 0 ? frequentIssues : mockStatistics.frequentIssues,
      resolutionTrend: mockStatistics.resolutionTrend,
    };

    set({ statistics, loading: false });
  },
}));

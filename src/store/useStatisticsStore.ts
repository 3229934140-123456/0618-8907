import { create } from 'zustand';
import { Statistics, Ticket, TicketType, TicketStatus, TicketPriority, TicketActionLog } from '../types';
import { storage } from '../services/storage';
import dayjs from 'dayjs';

const ISSUE_KEYWORDS: Record<string, string[]> = {
  '密码重置': ['密码', 'pass', 'pwd', '重置', '忘记', '登录'],
  'VPN连接问题': ['vpn', '远程', '连不上', '连接失败', '超时'],
  '打印机故障': ['打印', 'print', '打印机', '卡纸', '缺纸', '无法打印'],
  'WiFi连接问题': ['wifi', 'Wi-Fi', '无线网络', '连不上', '断网', '无法连接'],
  'Outlook邮件问题': ['outlook', '邮件', 'email', '收发', '收不到', '发不出'],
  'Office激活问题': ['office', '激活', 'word', 'excel', 'powerpoint'],
  '系统权限申请': ['权限', '访问', '申请', '开通', '角色'],
  '电脑蓝屏死机': ['蓝屏', '死机', '崩溃', '重启', '开不了机', 'blue screen'],
  '浏览器崩溃': ['浏览器', 'chrome', '谷歌', '崩溃', '闪退', '打不开'],
  '软件安装': ['安装', '下载', '软件', 'setup', 'install'],
  '账号锁定': ['账号', '帐户', '锁定', '禁用', '激活'],
  '网络访问问题': ['网络', '无法访问', '内网', '外网', '上不了网'],
};

interface StatisticsState {
  statistics: Statistics;
  loading: boolean;
  fetchStatistics: (startDate?: string, endDate?: string) => void;
}

const calculateResponseTime = (ticket: Ticket, logs: TicketActionLog[]): number | null => {
  const createdAt = dayjs(ticket.createdAt);
  
  const assignedLog = logs.find(l => l.action === 'assigned' || l.action === 'claimed');
  if (assignedLog) {
    const assignedAt = dayjs(assignedLog.createdAt);
    return assignedAt.diff(createdAt, 'minute');
  }
  
  if (ticket.assigneeId) {
    const firstAction = logs.filter(l => l.operatorId === ticket.assigneeId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    if (firstAction) {
      return dayjs(firstAction.createdAt).diff(createdAt, 'minute');
    }
  }
  
  return null;
};

const calculateResolutionTime = (ticket: Ticket, logs: TicketActionLog[]): number | null => {
  if (!ticket.resolvedAt) return null;
  
  const assignedLog = logs.find(l => l.action === 'assigned' || l.action === 'claimed');
  const resolvedAt = dayjs(ticket.resolvedAt);
  
  if (assignedLog) {
    const assignedAt = dayjs(assignedLog.createdAt);
    return resolvedAt.diff(assignedAt, 'minute');
  }
  
  const createdAt = dayjs(ticket.createdAt);
  return resolvedAt.diff(createdAt, 'minute');
};

const classifyIssue = (title: string, description: string): string => {
  const text = `${title} ${description}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  
  return '其他问题';
};

const getResolutionTrend = (tickets: Ticket[], startDate?: string, endDate?: string) => {
  const resolvedTickets = tickets.filter(t => t.resolvedAt);
  
  let filtered = resolvedTickets;
  if (startDate) {
    filtered = filtered.filter(t => t.resolvedAt! >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(t => t.resolvedAt! <= endDate);
  }
  
  const dateMap = new Map<string, number>();
  const days = 7;
  const today = dayjs();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = today.subtract(i, 'day').format('MM-DD');
    dateMap.set(date, 0);
  }
  
  filtered.forEach(ticket => {
    const date = dayjs(ticket.resolvedAt!).format('MM-DD');
    if (dateMap.has(date)) {
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    }
  });
  
  return Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
};

export const useStatisticsStore = create<StatisticsState>((set) => ({
  statistics: {
    totalTickets: 0,
    pendingTickets: 0,
    processingTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    ticketsByType: { hardware: 0, software: 0, permission: 0, network: 0 },
    ticketsByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
    ticketsByStatus: { pending: 0, assigned: 0, processing: 0, resolved: 0, closed: 0 },
    frequentIssues: [],
    resolutionTrend: [],
  },
  loading: false,

  fetchStatistics: (startDate, endDate) => {
    set({ loading: true });
    const tickets = storage.getTickets();
    const allLogs = storage.getActionLogs();
    
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

    const responseTimes: number[] = [];
    const resolutionTimes: number[] = [];
    
    filteredTickets.forEach(ticket => {
      const ticketLogs = allLogs.filter(l => l.ticketId === ticket.id);
      
      const rt = calculateResponseTime(ticket, ticketLogs);
      if (rt !== null && rt >= 0) {
        responseTimes.push(rt);
      }
      
      const rst = calculateResolutionTime(ticket, ticketLogs);
      if (rst !== null && rst >= 0) {
        resolutionTimes.push(rst);
      }
    });

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60)
      : 0;

    const avgResolutionTime = resolutionTimes.length > 0
      ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / 60)
      : 0;

    const frequentIssueMap = new Map<string, number>();
    filteredTickets.forEach(ticket => {
      const category = classifyIssue(ticket.title, ticket.description);
      frequentIssueMap.set(category, (frequentIssueMap.get(category) || 0) + 1);
    });

    const frequentIssues = Array.from(frequentIssueMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const resolutionTrend = getResolutionTrend(filteredTickets, startDate, endDate);

    const statistics: Statistics = {
      totalTickets: filteredTickets.length,
      pendingTickets: ticketsByStatus.pending || 0,
      processingTickets: ticketsByStatus.processing || 0,
      resolvedTickets: (ticketsByStatus.resolved || 0) + (ticketsByStatus.closed || 0),
      avgResponseTime,
      avgResolutionTime,
      ticketsByType: {
        hardware: 0, software: 0, permission: 0, network: 0, ...ticketsByType },
      ticketsByPriority: {
        low: 0, medium: 0, high: 0, urgent: 0, ...ticketsByPriority },
      ticketsByStatus: {
        pending: 0, assigned: 0, processing: 0, resolved: 0, closed: 0, ...ticketsByStatus },
      frequentIssues: frequentIssues.length > 0 ? frequentIssues : [
        { title: '暂无数据', count: 0 }
      ],
      resolutionTrend,
    };

    set({ statistics, loading: false });
  },
}));

import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Empty,
  Pagination,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  PlusCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTicketStore } from '../store/useTicketStore';
import { useAuthStore } from '../store/useAuthStore';
import TicketCard from '../components/Ticket/TicketCard';
import {
  TicketStatus,
  TicketType,
  TicketPriority,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
} from '../types';

const { Title } = Typography;
const { Option } = Select;

const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tickets, loading, fetchTickets } = useTicketStore();
  const { user } = useAuthStore();

  const [filters, setFilters] = useState<{
    status?: TicketStatus;
    type?: TicketType;
    priority?: TicketPriority;
    keyword?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') as TicketStatus | null;
    const priority = params.get('priority') as TicketPriority | null;
    const type = params.get('type') as TicketType | null;
    const keyword = params.get('keyword');

    const newFilters: any = {};
    if (status) newFilters.status = status;
    if (priority) newFilters.priority = priority;
    if (type) newFilters.type = type;
    if (keyword) newFilters.keyword = keyword;

    setFilters(newFilters);
    fetchTickets(newFilters);
  }, [location.search, fetchTickets]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    if (value === undefined || value === '' || value === null) {
      delete newFilters[key as keyof typeof newFilters];
    }
    setFilters(newFilters);
    setPage(1);
    fetchTickets(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v as string);
    });
    navigate({ search: params.toString() });
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
    fetchTickets({});
    navigate({ search: '' });
  };

  const handleSearch = (value: string) => {
    handleFilterChange('keyword', value);
  };

  const filteredTickets = tickets;
  const paginatedTickets = filteredTickets.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const canViewBatch = user?.role === 'engineer' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            工单列表
          </Title>
          <p className="text-gray-500 text-sm m-0">
            共 {filteredTickets.length} 条工单
          </p>
        </div>
        <Space>
          {canViewBatch && (
            <Button
              icon={<UnorderedListOutlined />}
              onClick={() => navigate('/tickets/batch')}
            >
              批量处理
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => navigate('/tickets/create')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0"
          >
            提交工单
          </Button>
        </Space>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input.Search
              placeholder="搜索工单标题或描述..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={filters.keyword}
              onSearch={handleSearch}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              placeholder="状态"
              allowClear
              size="large"
              style={{ width: 140 }}
              value={filters.status}
              onChange={(v) => handleFilterChange('status', v)}
              suffixIcon={<FilterOutlined />}
            >
              {Object.entries(TICKET_STATUS_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="类型"
              allowClear
              size="large"
              style={{ width: 120 }}
              value={filters.type}
              onChange={(v) => handleFilterChange('type', v)}
            >
              {Object.entries(TICKET_TYPE_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="优先级"
              allowClear
              size="large"
              style={{ width: 120 }}
              value={filters.priority}
              onChange={(v) => handleFilterChange('priority', v)}
            >
              {Object.entries(TICKET_PRIORITY_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>

            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={handleReset}
            >
              重置
            </Button>
          </div>
        </div>
      </Card>

      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Tag
              color="blue"
              closable
              onClose={() => handleFilterChange('status', undefined)}
            >
              状态: {TICKET_STATUS_LABELS[filters.status]}
            </Tag>
          )}
          {filters.type && (
            <Tag
              color="purple"
              closable
              onClose={() => handleFilterChange('type', undefined)}
            >
              类型: {TICKET_TYPE_LABELS[filters.type]}
            </Tag>
          )}
          {filters.priority && (
            <Tag
              color="orange"
              closable
              onClose={() => handleFilterChange('priority', undefined)}
            >
              优先级: {TICKET_PRIORITY_LABELS[filters.priority]}
            </Tag>
          )}
          {filters.keyword && (
            <Tag
              color="cyan"
              closable
              onClose={() => handleFilterChange('keyword', undefined)}
            >
              搜索: {filters.keyword}
            </Tag>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : paginatedTickets.length === 0 ? (
        <Card className="border-0">
          <Empty description="暂无工单数据" />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          {filteredTickets.length > pageSize && (
            <div className="flex justify-center pt-4">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredTickets.length}
                onChange={setPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TicketList;

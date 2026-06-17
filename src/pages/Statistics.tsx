import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Spin } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';
import { useStatisticsStore } from '../store/useStatisticsStore';
import {
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TicketType,
  TicketPriority,
  TicketStatus,
} from '../types';
import MainLayout from '../components/Layout/MainLayout';

const { RangePicker } = DatePicker;

const Statistics: React.FC = () => {
  const { statistics, loading, fetchStatistics } = useStatisticsStore();

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null]) => {
    if (dates[0] && dates[1]) {
      fetchStatistics(
        dates[0].startOf('day').toISOString(),
        dates[1].endOf('day').toISOString()
      );
    } else {
      fetchStatistics();
    }
  };

  const typeChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: '问题类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: Object.entries(statistics.ticketsByType).map(([key, value]) => ({
          value,
          name: TICKET_TYPE_LABELS[key as TicketType],
        })),
        color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316'],
      },
    ],
  };

  const priorityChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: Object.keys(statistics.ticketsByPriority).map(
        (key) => TICKET_PRIORITY_LABELS[key as TicketPriority]
      ),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '工单数量',
        type: 'bar',
        data: Object.values(statistics.ticketsByPriority),
        itemStyle: {
          color: (params: any) => {
            const colors = ['#94a3b8', '#3b82f6', '#f97316', '#ef4444'];
            return colors[params.dataIndex];
          },
          borderRadius: [8, 8, 0, 0],
        },
        barWidth: '50%',
      },
    ],
  };

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: statistics.resolutionTrend.map((item) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '解决工单',
        type: 'line',
        stack: 'Total',
        data: statistics.resolutionTrend.map((item) => item.count),
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
        lineStyle: {
          color: '#3b82f6',
          width: 3,
        },
        itemStyle: {
          color: '#3b82f6',
        },
      },
    ],
  };

  const statusChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}',
    },
    legend: {
      bottom: '0',
    },
    series: [
      {
        name: '工单状态',
        type: 'pie',
        radius: ['0%', '70%'],
        center: ['50%', '45%'],
        data: Object.entries(statistics.ticketsByStatus).map(([key, value]) => ({
          value,
          name: TICKET_STATUS_LABELS[key as TicketStatus],
        })),
        color: ['#94a3b8', '#3b82f6', '#06b6d4', '#22c55e', '#64748b'],
        label: {
          show: true,
          position: 'outside',
        },
      },
    ],
  };

  const maxIssueCount = Math.max(...statistics.frequentIssues.map((i) => i.count), 1);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">统计分析</h1>
            <p className="text-gray-500 mt-1">工单数据分析与趋势洞察</p>
          </div>
          <RangePicker
            defaultValue={[dayjs().subtract(30, 'day'), dayjs()]}
            onChange={handleDateChange}
            allowClear
          />
        </div>

        <Row gutter={16}>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
              <Statistic
                title="总工单数"
                value={statistics.totalTickets}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
              <Statistic
                title="待处理工单"
                value={statistics.pendingTickets}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
              <Statistic
                title="已解决工单"
                value={statistics.resolvedTickets}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#22c55e' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
              <Statistic
                title="平均处理时长"
                value={statistics.avgResolutionTime}
                suffix="小时"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#8b5cf6' }}
              />
            </Card>
          </Col>
        </Row>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Card title="问题类型分布" className="shadow-sm border-0">
                  <ReactECharts option={typeChartOption} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="优先级分布" className="shadow-sm border-0">
                  <ReactECharts option={priorityChartOption} style={{ height: 300 }} />
                </Card>
              </Col>
            </Row>

            <Card title="解决趋势" className="shadow-sm border-0">
              <ReactECharts option={trendChartOption} style={{ height: 300 }} />
            </Card>

            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Card title="状态分布" className="shadow-sm border-0">
                  <ReactECharts option={statusChartOption} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="高频故障类型" className="shadow-sm border-0">
                  <div className="space-y-4">
                    {statistics.frequentIssues.map((issue, index) => (
                      <div key={issue.title}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-red-500 text-white' :
                              index === 1 ? 'bg-orange-500 text-white' :
                              index === 2 ? 'bg-yellow-500 text-white' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-gray-700 font-medium">{issue.title}</span>
                          </div>
                          <span className="text-gray-500">{issue.count} 次</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${(issue.count / maxIssueCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} lg={8}>
                <Card className="shadow-sm border-0 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClockCircleOutlined className="text-3xl text-blue-500" />
                  </div>
                  <p className="text-gray-500 text-sm mb-1">平均响应时间</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statistics.avgResponseTime}
                    <span className="text-sm text-gray-400 ml-1">小时</span>
                  </p>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card className="shadow-sm border-0 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <RiseOutlined className="text-3xl text-green-500" />
                  </div>
                  <p className="text-gray-500 text-sm mb-1">解决率</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statistics.totalTickets > 0
                      ? Math.round((statistics.resolvedTickets / statistics.totalTickets) * 100)
                      : 0}
                    <span className="text-sm text-gray-400 ml-1">%</span>
                  </p>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card className="shadow-sm border-0 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileTextOutlined className="text-3xl text-purple-500" />
                  </div>
                  <p className="text-gray-500 text-sm mb-1">处理中工单</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statistics.processingTickets}
                    <span className="text-sm text-gray-400 ml-1">个</span>
                  </p>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Statistics;

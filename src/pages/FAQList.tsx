import React, { useState, useEffect } from 'react';
import { Card, Input, Tag, Space, Empty, Button, message, Tabs, Statistic, Row, Col } from 'antd';
import { SearchOutlined, LikeOutlined, EyeOutlined, BookOutlined } from '@ant-design/icons';
import { useFAQStore } from '../store/useFAQStore';
import { FAQ, TICKET_TYPE_LABELS, TICKET_TYPE_COLORS, TicketType } from '../types';

const { Search } = Input;
const { Meta } = Card;

const FAQList: React.FC = () => {
  const { faqs, loading, fetchFAQs, likeFAQ, incrementViewCount } = useFAQStore();
  const [keyword, setKeyword] = useState('');
  const [activeType, setActiveType] = useState<TicketType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    fetchFAQs({ keyword: value, type: activeType === 'all' ? undefined : activeType });
  };

  const handleTypeChange = (type: TicketType | 'all') => {
    setActiveType(type);
    fetchFAQs({ keyword, type: type === 'all' ? undefined : type });
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = likeFAQ(id);
    if (newCount !== undefined) {
      message.success('感谢您的反馈！');
    }
  };

  const handleExpand = (faq: FAQ) => {
    if (expandedId !== faq.id) {
      setExpandedId(faq.id);
      incrementViewCount(faq.id);
    } else {
      setExpandedId(null);
    }
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'hardware', label: TICKET_TYPE_LABELS.hardware },
    { key: 'software', label: TICKET_TYPE_LABELS.software },
    { key: 'permission', label: TICKET_TYPE_LABELS.permission },
    { key: 'network', label: TICKET_TYPE_LABELS.network },
  ];

  const topFAQs = [...faqs].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  return (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOutlined className="text-4xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">FAQ知识库</h1>
              <p className="text-blue-100">常见问题解答，自助解决IT问题</p>
            </div>
          </div>
          <div className="max-w-2xl">
            <Search
              placeholder="搜索问题关键词，如：密码、网络、安装..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>

        <Row gutter={16}>
          <Col xs={24} lg={16}>
            <Card className="shadow-sm border-0">
              <Tabs
                activeKey={activeType}
                onChange={(key) => handleTypeChange(key as TicketType | 'all')}
                items={tabItems}
              />
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : faqs.length === 0 ? (
                <Empty description="暂无相关问题" />
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <Card
                      key={faq.id}
                      className={`cursor-pointer transition-all duration-300 border-0 shadow-sm hover:shadow-md ${
                        expandedId === faq.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleExpand(faq)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Tag color={TICKET_TYPE_COLORS[faq.type]}>
                              {TICKET_TYPE_LABELS[faq.type]}
                            </Tag>
                            {faq.tags.map((tag, index) => (
                              <Tag key={index} color="default">{tag}</Tag>
                            ))}
                          </div>
                          <Meta
                            title={
                              <span className="text-gray-800 font-medium">
                                Q: {faq.title}
                              </span>
                            }
                            description={null}
                          />
                        </div>
                        <Button
                          type="text"
                          icon={expandedId === faq.id ? '▲' : '▼'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpand(faq);
                          }}
                        />
                      </div>
                      
                      {expandedId === faq.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {faq.content}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                            <Space size="large">
                              <span className="text-gray-400 text-sm flex items-center gap-1">
                                <EyeOutlined /> {faq.viewCount} 次浏览
                              </span>
                              <Button
                                type="text"
                                icon={<LikeOutlined />}
                                onClick={(e) => handleLike(faq.id, e)}
                                className="text-gray-400 hover:text-blue-500"
                              >
                                有帮助 ({faq.likeCount})
                              </Button>
                            </Space>
                            <span className="text-gray-400 text-xs">
                              更新于 {new Date(faq.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="🔥 热门问题" className="shadow-sm border-0 mb-6">
              <div className="space-y-3">
                {topFAQs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleExpand(faq)}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-red-500 text-white' :
                      index === 1 ? 'bg-orange-500 text-white' :
                      index === 2 ? 'bg-yellow-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{faq.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        <EyeOutlined /> {faq.viewCount} 浏览
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="shadow-sm border-0">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="问题总数"
                    value={faqs.length}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="总浏览量"
                    value={faqs.reduce((sum, f) => sum + f.viewCount, 0)}
                    prefix={<EyeOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
    </div>
  );
};

export default FAQList;

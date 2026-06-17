import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Radio,
  Button,
  message,
  Row,
  Col,
  Alert,
  Tag,
  Space,
  Divider,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  BookOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/useTicketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useFAQStore } from '../store/useFAQStore';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  TicketType,
  TicketPriority,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  FAQ,
} from '../types';
import { storage } from '../services/storage';
import { TypeBadge } from '../components/Ticket/StatusBadge';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createTicket } = useTicketStore();
  const { getRecommendedFAQs, likeFAQ } = useFAQStore();
  const { addNotification } = useNotificationStore();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [recommendedFAQs, setRecommendedFAQs] = useState<FAQ[]>([]);
  const [showFAQDetail, setShowFAQDetail] = useState<FAQ | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const typeOptions: { value: TicketType; label: string; icon: string }[] = [
    { value: 'hardware', label: '硬件问题', icon: '💻' },
    { value: 'software', label: '软件问题', icon: '📱' },
    { value: 'permission', label: '权限问题', icon: '🔐' },
    { value: 'network', label: '网络问题', icon: '🌐' },
  ];

  const priorityOptions: { value: TicketPriority; label: string; color: string }[] = [
    { value: 'low', label: '低 - 不影响正常工作', color: 'default' },
    { value: 'medium', label: '中 - 影响部分功能', color: 'blue' },
    { value: 'high', label: '高 - 影响主要工作', color: 'orange' },
    { value: 'urgent', label: '紧急 - 影响生产系统', color: 'red' },
  ];

  const watchTitle = Form.useWatch('title', form);
  const watchDescription = Form.useWatch('description', form);
  const watchType = Form.useWatch('type', form);

  useEffect(() => {
    if ((watchTitle || watchDescription) && showRecommendations) {
      const faqs = getRecommendedFAQs(watchTitle || '', watchDescription || '');
      if (watchType) {
        const filtered = faqs.filter(f => f.type === watchType);
        setRecommendedFAQs(filtered.length > 0 ? filtered : faqs);
      } else {
        setRecommendedFAQs(faqs);
      }
    } else {
      setRecommendedFAQs([]);
    }
  }, [watchTitle, watchDescription, watchType, getRecommendedFAQs, showRecommendations]);

  const handleSubmit = async (values: {
    title: string;
    description: string;
    type: TicketType;
    priority: TicketPriority;
  }) => {
    if (!user) return;
    setLoading(true);
    try {
      const ticket = createTicket({
        ...values,
        creatorId: user.id,
        creatorName: user.name,
      });

      message.success('工单提交成功！');

      const engineers = storage.getUsers().filter(u => u.role === 'engineer' || u.role === 'admin');
      engineers.forEach(engineer => {
        addNotification({
          userId: engineer.id,
          title: values.priority === 'urgent' ? '紧急工单提醒' : '新工单待认领',
          content: `工单 #${ticket.id} ${values.title} (${TICKET_TYPE_LABELS[values.type]}) 需要处理`,
          type: values.priority === 'urgent' ? 'urgent' : 'ticket',
          ticketId: ticket.id,
        });
      });

      navigate(`/tickets/${ticket.id}`);
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFAQClick = (faq: FAQ) => {
    setShowFAQDetail(faq);
  };

  const handleLikeFAQ = (faqId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    likeFAQ(faqId);
    message.success('感谢您的反馈！');
  };

  const handleSelfResolved = () => {
    Modal.confirm({
      title: '🎉 问题已解决？',
      content: (
        <div className="space-y-4">
          <p>很高兴知识库帮助您解决了问题！请选择接下来的操作：</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <BookOutlined className="text-2xl text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">返回知识库</p>
                <p className="text-xs text-gray-400">继续浏览其他问题</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <SendOutlined className="text-2xl text-gray-500 mb-2" />
                <p className="text-sm text-gray-600">继续提交</p>
                <p className="text-xs text-gray-400">问题仍未解决</p>
              </div>
            </div>
          </div>
        </div>
      ),
      okText: '返回知识库',
      cancelText: '继续提交',
      onOk: () => {
        navigate('/faq');
      },
      onCancel: () => {
        setShowRecommendations(false);
        setShowFAQDetail(null);
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')}>
          返回列表
        </Button>
        <div>
          <Title level={3} className="!m-0">
            提交工单
          </Title>
          <p className="text-gray-500 text-sm m-0">
            描述您遇到的IT问题，我们将尽快为您处理
          </p>
        </div>
      </div>

      {recommendedFAQs.length > 0 && showRecommendations && (
        <Alert
          message={
            <div className="flex items-center gap-2">
              <BulbOutlined className="text-yellow-500" />
              <span>根据您的描述，我们推荐以下解决方案，可能帮您快速解决问题：</span>
            </div>
          }
          type="warning"
          showIcon
          action={
            <Button size="small" type="text" onClick={() => setShowRecommendations(false)}>
              隐藏推荐
            </Button>
          }
        />
      )}

      {recommendedFAQs.length > 0 && showRecommendations && (
        <Card className="border-0 shadow-sm bg-yellow-50">
          <div className="space-y-4">
            {recommendedFAQs.map((faq) => (
              <div
                key={faq.id}
                className="p-4 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleFAQClick(faq)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOutlined className="text-blue-500" />
                      <Text strong className="text-base">
                        {faq.title}
                      </Text>
                      <TypeBadge type={faq.type} />
                    </div>
                    <Text type="secondary" className="text-sm line-clamp-2">
                      {faq.content}
                    </Text>
                    <div className="flex items-center gap-4 mt-2">
                      <Text type="secondary" className="text-xs">
                        👁️ {faq.viewCount} 次浏览
                      </Text>
                      <Button
                        type="text"
                        size="small"
                        icon={<LikeOutlined />}
                        onClick={(e) => handleLikeFAQ(faq.id, e)}
                        className="text-xs !p-0"
                      >
                        有用 ({faq.likeCount})
                      </Button>
                    </div>
                  </div>
                  <Button type="primary" size="small">
                    查看详情
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ priority: 'medium' }}
        >
          <Form.Item
            name="title"
            label={
              <span className="font-medium">
                问题标题 <span className="text-red-500">*</span>
              </span>
            }
            rules={[
              { required: true, message: '请输入问题标题' },
              { min: 5, message: '标题至少5个字符' },
            ]}
          >
            <Input
              size="large"
              placeholder="请简要描述您遇到的问题，例如：电脑无法开机、打印机无法打印等"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label={
                  <span className="font-medium">
                    问题类型 <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: '请选择问题类型' }]}
              >
                <Select size="large" placeholder="请选择问题类型">
                  {typeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priority"
                label={
                  <span className="font-medium">
                    紧急程度 <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: '请选择紧急程度' }]}
              >
                <Radio.Group size="large" className="w-full">
                  {priorityOptions.map((option) => (
                    <Radio.Button
                      key={option.value}
                      value={option.value}
                      className="!w-1/2 !text-center sm:!w-1/4"
                    >
                      {option.label.split(' - ')[0]}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {watchType && (
            <Alert
              message={
                <div className="flex items-center gap-2">
                  <InfoCircleOutlined />
                  <span>
                    您选择的是
                    <Tag color="blue" className="mx-1">
                      {TICKET_TYPE_LABELS[watchType]}
                    </Tag>
                    问题，我们将安排相关工程师处理
                  </span>
                </div>
              }
              type="info"
              showIcon
              className="mb-6"
            />
          )}

          <Form.Item
            name="description"
            label={
              <span className="font-medium">
                问题描述 <span className="text-red-500">*</span>
              </span>
            }
            rules={[
              { required: true, message: '请输入问题描述' },
              { min: 10, message: '请详细描述问题，至少10个字符' },
            ]}
            extra="请详细描述问题现象、出现时间、操作步骤等信息，有助于我们更快定位和解决问题"
          >
            <TextArea
              rows={6}
              placeholder="例如：今天早上9点左右，我打开电脑后发现屏幕显示蓝屏，错误代码为0x0000007B，重启后问题仍然存在。之前没有出现过类似问题，没有安装新软件。"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Divider />

          <div className="flex justify-between items-center">
            <Text type="secondary" className="text-sm">
              <InfoCircleOutlined className="mr-1" />
              提交后，IT工程师将尽快处理您的工单，紧急问题将优先处理
            </Text>
            <Space>
              <Button size="large" onClick={() => navigate('/tickets')}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 px-8"
              >
                提交工单
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Modal
        title={showFAQDetail?.title}
        open={!!showFAQDetail}
        onCancel={() => setShowFAQDetail(null)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setShowFAQDetail(null)}>
            关闭
          </Button>,
          <Button key="resolved" type="primary" onClick={handleSelfResolved}>
            问题已解决
          </Button>,
          <Button key="like" onClick={(e) => showFAQDetail && handleLikeFAQ(showFAQDetail.id, e)}>
            <LikeOutlined /> 有用 ({showFAQDetail?.likeCount})
          </Button>,
        ]}
      >
        {showFAQDetail && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TypeBadge type={showFAQDetail.type} />
              <Text type="secondary" className="text-sm">
                浏览 {showFAQDetail.viewCount} 次 · 有用 {showFAQDetail.likeCount} 次
              </Text>
            </div>
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
              {showFAQDetail.content}
            </div>
            {showFAQDetail.tags.length > 0 && (
              <div className="mt-4">
                <Text type="secondary" className="text-sm mr-2">
                  相关标签：
                </Text>
                {showFAQDetail.tags.map((tag) => (
                  <Tag key={tag} color="blue">
                    {tag}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CreateTicket;

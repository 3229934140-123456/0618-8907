import React, { useEffect } from 'react';
import { Card, List, Button, Tag, Empty, Space, message, Badge, Tabs } from 'antd';
import {
  NotificationOutlined,
  BellOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { Notification as NotificationType } from '../types';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const { notifications, loading, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  const handleMarkAllAsRead = () => {
    if (user) {
      markAllAsRead(user.id);
      message.success('已标记全部为已读');
    }
  };

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read && user) {
      markAsRead(notification.id, user.id);
    }
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertOutlined className="text-red-500" />;
      case 'ticket':
        return <NotificationOutlined className="text-blue-500" />;
      default:
        return <BellOutlined className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'red';
      case 'ticket':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent':
        return '紧急';
      case 'ticket':
        return '工单';
      default:
        return '系统';
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          全部
          <Badge count={notifications.length} size="small" className="ml-2" color="blue" />
        </span>
      ),
      notifications: notifications,
    },
    {
      key: 'unread',
      label: (
        <span>
          未读
          <Badge count={unreadCount} size="small" className="ml-2" color="red" />
        </span>
      ),
      notifications: unreadNotifications,
    },
    {
      key: 'read',
      label: <span>已读</span>,
      notifications: readNotifications,
    },
  ];

  const renderNotificationItem = (notification: NotificationType) => (
    <List.Item
      key={notification.id}
      className={`cursor-pointer hover:bg-gray-50 transition-colors rounded-lg px-4 ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <List.Item.Meta
        avatar={
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            notification.type === 'urgent' ? 'bg-red-100' :
            notification.type === 'ticket' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {getTypeIcon(notification.type)}
          </div>
        }
        title={
          <div className="flex items-center gap-2">
            <span className={!notification.read ? 'font-semibold text-gray-800' : 'text-gray-600'}>
              {notification.title}
            </span>
            <Tag color={getTypeColor(notification.type)}>
              {getTypeLabel(notification.type)}
            </Tag>
            {notification.type === 'urgent' && (
              <Badge status="processing" color="red" />
            )}
          </div>
        }
        description={
          <div className="mt-1">
            <p className="text-gray-500 text-sm line-clamp-2">{notification.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-400 text-xs">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
              {notification.ticketId && (
                <span className="text-blue-500 text-xs flex items-center gap-1">
                  查看工单 <RightOutlined />
                </span>
              )}
            </div>
          </div>
        }
      />
      {!notification.read && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
      )}
    </List.Item>
  );

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">通知中心</h1>
            <p className="text-gray-500 mt-1">查看系统通知和工单动态</p>
          </div>
          <Space>
            {unreadCount > 0 && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkAllAsRead}
              >
                全部已读
              </Button>
            )}
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-sm border-0 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <NotificationOutlined className="text-xl text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
            <p className="text-gray-500 text-sm">全部通知</p>
          </Card>
          <Card className="shadow-sm border-0 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertOutlined className="text-xl text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{unreadCount}</p>
            <p className="text-gray-500 text-sm">未读通知</p>
          </Card>
          <Card className="shadow-sm border-0 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircleOutlined className="text-xl text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{readNotifications.length}</p>
            <p className="text-gray-500 text-sm">已读通知</p>
          </Card>
        </div>

        <Card className="shadow-sm border-0">
          <Tabs
            defaultActiveKey="all"
            items={tabItems.map((item) => ({
              key: item.key,
              label: item.label,
              children:
                item.notifications.length === 0 ? (
                  <Empty
                    description={item.key === 'unread' ? '暂无未读通知' : '暂无通知'}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <List
                    loading={loading}
                    dataSource={item.notifications}
                    renderItem={renderNotificationItem}
                    className="divide-y divide-gray-100"
                  />
                ),
            }))}
          />
        </Card>
    </div>
  );
};

export default Notifications;

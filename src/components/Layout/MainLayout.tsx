import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import {
  DashboardOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  BookOutlined,
  BarChartOutlined,
  NotificationOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
      onClick: () => navigate('/'),
    },
    {
      key: '/tickets',
      icon: <FileTextOutlined />,
      label: '工单列表',
      onClick: () => navigate('/tickets'),
    },
    {
      key: '/tickets/create',
      icon: <PlusCircleOutlined />,
      label: '提交工单',
      onClick: () => navigate('/tickets/create'),
    },
    {
      key: '/faq',
      icon: <BookOutlined />,
      label: '知识库',
      onClick: () => navigate('/faq'),
    },
    ...(user?.role === 'engineer' || user?.role === 'admin'
      ? [
          {
            key: '/tickets/batch',
            icon: <UnorderedListOutlined />,
            label: '批量处理',
            onClick: () => navigate('/tickets/batch'),
          },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          {
            key: '/statistics',
            icon: <BarChartOutlined />,
            label: '统计分析',
            onClick: () => navigate('/statistics'),
          },
        ]
      : []),
    {
      key: '/notifications',
      icon: (
        <Badge count={unreadCount} size="small" offset={[5, -2]}>
          <NotificationOutlined />
        </Badge>
      ),
      label: '通知中心',
      onClick: () => navigate('/notifications'),
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white border-r border-gray-100"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">IT</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-800">IT支持台</h1>
                <p className="text-xs text-gray-500">Helpdesk System</p>
              </div>
            )}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="h-full border-r-0 py-4"
        />
      </Sider>
      <Layout>
        <Header className="bg-white border-b border-gray-100 px-6 flex items-center justify-between h-16">
          <Button
            type="text"
            icon={collapsed ? <span className="text-xl">☰</span> : <span className="text-xl">◀</span>}
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-gray-100"
          />
          <div className="flex items-center gap-4">
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar
                  size={36}
                  className="bg-gradient-to-br from-blue-500 to-purple-500"
                  icon={<UserOutlined />}
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-800 m-0">{user?.name}</p>
                  <p className="text-xs text-gray-500 m-0">
                    {user?.role === 'admin'
                      ? '管理员'
                      : user?.role === 'engineer'
                      ? 'IT工程师'
                      : '员工'}
                  </p>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

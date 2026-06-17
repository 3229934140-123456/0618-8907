import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MonitorOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.username, values.password);
      if (success) {
        message.success('登录成功！');
        navigate('/');
      } else {
        message.error('用户名或密码错误！默认密码：123456');
      }
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-2xl">
            <MonitorOutlined className="text-4xl text-white" />
          </div>
          <Title level={2} className="!mb-2 !text-gray-800">
            IT 支持帮助台
          </Title>
          <Text type="secondary" className="text-lg">
            公司内部 IT 问题一站式解决平台
          </Text>
        </div>

        <Card className="shadow-2xl rounded-2xl border-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
          
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            className="pt-4"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="用户名"
                size="large"
                className="h-12"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码"
                size="large"
                className="h-12"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <Text type="secondary" className="text-sm">
              <p className="mb-1"><strong>测试账号：</strong></p>
              <p className="mb-1">• 员工：zhangsan / 123456</p>
              <p className="mb-1">• 工程师：itengineer1 / 123456</p>
              <p>• 管理员：admin / 123456</p>
            </Text>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Text type="secondary" className="text-sm">
            © 2024 公司 IT 部门 · 内部使用
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Login;

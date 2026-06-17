import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Avatar, Image, Upload, message } from 'antd';
import {
  SendOutlined,
  PictureOutlined,
  FileOutlined,
  UserOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Message, User } from '../../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface ChatWindowProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', attachment?: any) => void;
  disabled?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUser,
  onSendMessage,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          onSendMessage('上传了一张截图', 'image', {
            name: file.name,
            url: imageUrl,
            type: file.type,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      } else {
        onSendMessage(`上传了文件: ${file.name}`, 'file', {
          name: file.name,
          url: '#',
          type: file.type,
          size: file.size,
        });
      }
      message.success('文件上传成功');
      return false;
    },
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.type === 'image' && msg.attachment) {
      return (
        <div className="mt-2">
          <p className="text-sm mb-1">{msg.content}</p>
          <Image
            width={240}
            src={msg.attachment.url}
            className="rounded-lg shadow-md"
            preview
          />
        </div>
      );
    }
    if (msg.type === 'file' && msg.attachment) {
      return (
        <div className="flex items-center gap-2 mt-1 bg-white/50 p-2 rounded-lg">
          <FileOutlined className="text-blue-500" />
          <span className="text-sm">{msg.attachment.name}</span>
          <span className="text-xs text-gray-400">
            ({(msg.attachment.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      );
    }
    return <p className="whitespace-pre-wrap m-0">{msg.content}</p>;
  };

  const isOwnMessage = (msg: Message) => msg.senderId === currentUser.id;

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <RobotOutlined className="text-4xl mb-2" />
            <p>暂无消息，开始沟通吧</p>
          </div>
        ) : (
          <List
            dataSource={messages}
            renderItem={(msg) => (
              <List.Item
                className={`border-0 p-0 mb-4 flex ${
                  isOwnMessage(msg) ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[80%] ${
                    isOwnMessage(msg) ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar
                    size={36}
                    className={
                      msg.senderRole === 'engineer' || msg.senderRole === 'admin'
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                        : 'bg-gradient-to-br from-blue-400 to-cyan-400'
                    }
                    icon={<UserOutlined />}
                  />
                  <div
                    className={`flex flex-col ${
                      isOwnMessage(msg) ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        isOwnMessage(msg) ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <span className="text-xs font-medium text-gray-700">
                        {msg.senderName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {dayjs(msg.createdAt).format('HH:mm')}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage(msg)
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-md'
                          : 'bg-gray-100 text-gray-800 rounded-tl-md'
                      }`}
                    >
                      {renderMessageContent(msg)}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {!disabled && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-2">
            <Upload {...uploadProps}>
              <Button icon={<PictureOutlined />} className="shrink-0" />
            </Upload>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="shrink-0"
            >
              发送
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

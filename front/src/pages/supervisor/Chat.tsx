import React, { useState, useEffect, useRef } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { chatApiService } from '../../services/chatApi';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  student_code?: string;
  faculty?: string;
  major?: string;
  phone?: string;
  display_name: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  message_type: string;
  sent_at: string;
  is_read: boolean;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_role?: string;
  receiver_first_name?: string;
  receiver_last_name?: string;
  receiver_role?: string;
}

interface Conversation {
  id: number;
  other_user_id: number;
  other_user_first_name: string;
  other_user_last_name: string;
  other_user_role: string;
  other_user_profile_image?: string;
  last_message: string;
  last_message_type: string;
  last_message_time: string;
  last_message_sender_id: number;
  unread_count: number;
  last_activity: string;
}

const SupervisorChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
  }, []);

  // Removed polling to prevent constant refreshing

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id.toString(), true);
    }
  }, [selectedUser]);

  useEffect(() => {
    // Only scroll to bottom when new messages are added, not on every message update
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatApiService.getConversations();
      if (response.success) {
        setConversations(response.data || []);
        // Calculate total unread count
        const totalUnread = (response.data || []).reduce((sum, conv) => sum + conv.unread_count, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await chatApiService.getAllUsers();
      if (response.success) {
        setAllUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const fetchMessages = async (userId: string, showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await chatApiService.getMessages(parseInt(userId));
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    try {
      setSending(true);
      const response = await chatApiService.sendMessage(
        selectedUser.id,
        newMessage.trim(),
        'text'
      );

      if (response.success) {
        setNewMessage('');
        // Add the new message to the messages list immediately
        if (response.data) {
          setMessages(prev => [...prev, response.data!]);
        }
        // Refresh conversations to update unread count
        await fetchConversations();
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
      } else {
        alert(response.message || 'ไม่สามารถส่งข้อความได้');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setSending(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowUserSelector(false);
    setSearchTerm('');
  };

  const handleConversationSelect = (conversation: Conversation) => {
    const user: User = {
      id: conversation.other_user_id,
      first_name: conversation.other_user_first_name,
      last_name: conversation.other_user_last_name,
      email: '',
      role: conversation.other_user_role,
      display_name: `${conversation.other_user_first_name} ${conversation.other_user_last_name}`
    };
    setSelectedUser(user);
    // Refresh conversations to update unread count
    fetchConversations();
  };

  const filteredUsers = allUsers.filter(user =>
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: { color: string; text: string } } = {
      'student': { color: 'bg-green-100 text-green-800', text: 'นักศึกษา' },
      'teacher': { color: 'bg-blue-100 text-blue-800', text: 'ครูพี่เลี้ยง' },
      'supervisor': { color: 'bg-purple-100 text-purple-800', text: 'อาจารย์นิเทศ' },
      'admin': { color: 'bg-red-100 text-red-800', text: 'ผู้ดูแลระบบ' }
    };
    
    const roleInfo = roleMap[role] || { color: 'bg-gray-100 text-gray-800', text: role };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
        {roleInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="แชท">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="แชท">
      <div className="h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900">แชท</h1>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowUserSelector(true)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  ส่งข้อความใหม่
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาการสนทนา..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>ยังไม่มีการสนทนา</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                        selectedUser?.id === conversation.other_user_id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {conversation.other_user_first_name.charAt(0)}{conversation.other_user_last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.other_user_first_name} {conversation.other_user_last_name}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRoleBadge(conversation.other_user_role)}
                            <p className="text-xs text-gray-500">
                              {new Date(conversation.last_message_time).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.last_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {selectedUser.first_name.charAt(0)}{selectedUser.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </h2>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(selectedUser.role)}
                        {selectedUser.student_code && (
                          <span className="text-sm text-gray-500">({selectedUser.student_code})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>ยังไม่มีข้อความ</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_role === 'supervisor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_role === 'supervisor'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_role === 'supervisor' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.sent_at).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="พิมพ์ข้อความ..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {sending ? 'กำลังส่ง...' : 'ส่ง'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg">เลือกการสนทนาหรือส่งข้อความใหม่</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Selector Modal */}
        {showUserSelector && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">เลือกผู้รับข้อความ</h3>
                
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="ค้นหาผู้ใช้..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Users List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.display_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowUserSelector(false);
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoggedLayout>
  );
};

export default SupervisorChat;

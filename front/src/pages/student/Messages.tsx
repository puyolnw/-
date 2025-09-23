import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { chatApiService, type Message, type Conversation } from '../../services/chatApi';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  
  // New chat modal states
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState<'teacher' | 'supervisor'>('teacher');

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle URL parameter for teacher selection
  useEffect(() => {
    const teacherId = searchParams.get('teacher');
    if (teacherId && conversations.length > 0) {
      console.log('🔵 Frontend - Teacher ID from URL:', teacherId);
      // Find conversation with this teacher
      const teacherConversation = conversations.find(conv => conv.other_user_id === parseInt(teacherId));
      if (teacherConversation) {
        console.log('🔵 Frontend - Found teacher conversation:', teacherConversation);
        setSelectedConversation(teacherConversation);
        fetchMessages(teacherConversation.other_user_id);
      } else {
        console.log('🔵 Frontend - No conversation found with teacher:', teacherId);
        // If no conversation exists, we might need to create one or show a message
        alert('ยังไม่มีการสนทนากับครูพี่เลี้ยงคนนี้');
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.other_user_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Frontend - Fetching conversations...');
      const response = await chatApiService.getConversations();
      console.log('🔵 Frontend - Conversations response:', response);
      
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.message || 'ไม่พบข้อมูลการสนทนา');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching conversations:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลการสนทนา');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      setLoadingTeachers(true);
      console.log('🔵 Frontend - Fetching available teachers...');
      
      // ดึงข้อมูลครูพี่เลี้ยงในโรงเรียนที่นักเรียนสังกัด
      const response = await apiService.get('/chat/student/available-teachers');
      console.log('🔵 Frontend - Available teachers response:', response);
      
      if (response.success && response.data) {
        setAvailableTeachers(response.data);
      } else {
        console.error('Failed to fetch teachers:', response.message);
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchAvailableSupervisors = async () => {
    try {
      setLoadingTeachers(true);
      console.log('🔵 Frontend - Fetching available supervisors...');
      
      // ดึงข้อมูลอาจารย์นิเทศ
      const response = await apiService.get('/chat/student/available-supervisors');
      console.log('🔵 Frontend - Available supervisors response:', response);
      
      if (response.success && response.data) {
        setAvailableSupervisors(response.data);
      } else {
        console.error('Failed to fetch supervisors:', response.message);
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching supervisors:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      console.log('🔵 Frontend - Fetching messages for user:', userId);
      const response = await chatApiService.getMessages(userId);
      console.log('🔵 Frontend - Messages response:', response);
      
      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        setError(response.message || 'ไม่พบข้อมูลข้อความ');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching messages:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลข้อความ');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    // If no conversation selected, try to get teacher ID from URL
    let targetUserId = selectedConversation?.other_user_id;
    let targetUserName = selectedConversation ? 
      `${selectedConversation.other_user_first_name} ${selectedConversation.other_user_last_name}` : 
      null;

    if (!targetUserId) {
      const teacherId = searchParams.get('teacher');
      if (teacherId) {
        targetUserId = parseInt(teacherId);
        // Try to get teacher name from conversations or show generic message
        const teacherConv = conversations.find(conv => conv.other_user_id === parseInt(teacherId));
        if (teacherConv) {
          targetUserName = `${teacherConv.other_user_first_name} ${teacherConv.other_user_last_name}`;
        } else {
          targetUserName = 'ครูพี่เลี้ยง';
        }
      } else {
        alert('กรุณาเลือกการสนทนาหรือครูพี่เลี้ยง');
        return;
      }
    }

    try {
      setSending(true);
      
      console.log('🔵 Frontend - Sending message to:', targetUserId);
      
      // Show confirmation for first message
      if (!selectedConversation && messages.length === 0) {
        const confirmMessage = `คุณกำลังส่งข้อความไปหา ${targetUserName || 'ครูพี่เลี้ยง'} ใช่หรือไม่?`;
        if (!confirm(confirmMessage)) {
          setSending(false);
          return;
        }
      }
      
      const response = await chatApiService.sendMessage(targetUserId, newMessage);
      console.log('🔵 Frontend - Send message response:', response);
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
        setNewMessage('');
        
        // Show success message for first message
        if (!selectedConversation && messages.length === 0) {
          alert(`ส่งข้อความไปหา ${targetUserName || 'ครูพี่เลี้ยง'} เรียบร้อยแล้ว!`);
        }
        
        // If no conversation was selected, create a new one
        if (!selectedConversation) {
          // Refresh conversations to get the new one
          fetchConversations();
        } else {
          // Update existing conversation
          setConversations(prev => prev.map(conv => 
            conv.other_user_id === targetUserId 
              ? { 
                  ...conv, 
                  last_message: newMessage, 
                  last_message_time: new Date().toISOString(), 
                  unread_count: 0,
                  last_message_sender_id: response.data!.sender_id
                }
              : conv
          ));
        }
      } else {
        alert(`ไม่สามารถส่งข้อความได้: ${response.message}`);
      }
      
    } catch (error) {
      console.error('🔵 Frontend - Error sending message:', error);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
    setSelectedChatType('teacher');
    // ดึงข้อมูลครูเมื่อเปิด modal
    fetchAvailableTeachers();
  };

  const handleStartChat = async (userId: number, userName: string, userRole: string) => {
    try {
      setShowNewChatModal(false);
      
      // ตรวจสอบว่ามีการสนทนาอยู่แล้วหรือไม่
      const existingConversation = conversations.find(conv => conv.other_user_id === userId);
      
      if (existingConversation) {
        // ถ้ามีการสนทนาอยู่แล้ว ให้เลือกการสนทนานั้น
        setSelectedConversation(existingConversation);
        fetchMessages(userId);
      } else {
        // ถ้ายังไม่มีการสนทนา ให้สร้างการสนทนาใหม่
        // โดยการส่งข้อความเริ่มต้น
        const welcomeMessage = `สวัสดีครับ/ค่ะ ${userRole === 'teacher' ? 'คุณครู' : 'อาจารย์'} ${userName}`;
        
        const response = await chatApiService.sendMessage(userId, welcomeMessage);
        if (response.success) {
          // รีเฟรชรายการการสนทนา
          await fetchConversations();
          
          // หาการสนทนาใหม่ที่เพิ่งสร้าง
          const newConversation = conversations.find(conv => conv.other_user_id === userId);
          if (newConversation) {
            setSelectedConversation(newConversation);
            fetchMessages(userId);
          }
        }
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('เกิดข้อผิดพลาดในการเริ่มการสนทนา');
    }
  };

  const handleChatTypeChange = (type: 'teacher' | 'supervisor') => {
    setSelectedChatType(type);
    if (type === 'teacher') {
      fetchAvailableTeachers();
    } else {
      fetchAvailableSupervisors();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="messages">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">กำลังโหลดข้อความ...</span>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="messages">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">กล่องข้อความ</h1>
                <p className="mt-2 text-gray-600">ติดต่อสื่อสารกับครูพี่เลี้ยงและอาจารย์ผู้นิเทศ</p>
              </div>
              <button
                onClick={handleNewChat}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                แชทใหม่
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex h-[600px]">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">การสนทนา</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="mt-2">ยังไม่มีการสนทนา</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.other_user_id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.other_user_id === conversation.other_user_id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 relative">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conversation.other_user_first_name} {conversation.other_user_last_name}
                              </p>
                              {conversation.unread_count > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                  {conversation.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.last_message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatTime(conversation.last_message_time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 relative">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {selectedConversation.other_user_first_name} {selectedConversation.other_user_last_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {selectedConversation.other_user_role === 'teacher' ? 'ครูพี่เลี้ยง' : selectedConversation.other_user_role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => {
                        // ตรวจสอบว่าเป็นข้อความที่ส่งโดยผู้ใช้ปัจจุบันหรือไม่
                        const isOwnMessage = message.sender_id === user?.id;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.sent_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="พิมพ์ข้อความ..."
                          className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          disabled={sending}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {sending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">เริ่มการสนทนาใหม่</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchParams.get('teacher') ? 
                          'เริ่มการสนทนาใหม่กับครูพี่เลี้ยง' : 
                          'เลือกการสนทนาจากรายการด้านซ้าย หรือเริ่มการสนทนาใหม่กับครูพี่เลี้ยง'
                        }
                      </p>
                      
                      {/* Show teacher info if available */}
                      {searchParams.get('teacher') && (() => {
                        const teacherId = searchParams.get('teacher');
                        const teacherConv = conversations.find(conv => conv.other_user_id === parseInt(teacherId!));
                        return teacherConv ? (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  {teacherConv.other_user_first_name} {teacherConv.other_user_last_name}
                                </p>
                                <p className="text-xs text-blue-600">ครูพี่เลี้ยง</p>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                      
                      {/* Message Input for new conversation */}
                      <div className="mt-6 w-full max-w-md">
                        <div className="flex space-x-2">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="พิมพ์ข้อความเพื่อเริ่มการสนทนา..."
                            className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            disabled={sending}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {sending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">เริ่มการสนทนาใหม่</h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Type Selection */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleChatTypeChange('teacher')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedChatType === 'teacher'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">ครูพี่เลี้ยง</span>
                    </div>
                    <p className="text-sm mt-1 text-gray-500">ครูในโรงเรียนที่คุณสังกัด</p>
                  </button>
                  
                  <button
                    onClick={() => handleChatTypeChange('supervisor')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedChatType === 'supervisor'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">อาจารย์นิเทศ</span>
                    </div>
                    <p className="text-sm mt-1 text-gray-500">อาจารย์ผู้นิเทศจากมหาวิทยาลัย</p>
                  </button>
                </div>
              </div>

              {/* User List */}
              <div className="max-h-96 overflow-y-auto">
                {loadingTeachers ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">กำลังโหลด...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedChatType === 'teacher' ? availableTeachers : availableSupervisors).map((person) => (
                      <div
                        key={person.id}
                        onClick={() => handleStartChat(
                          person.id, 
                          `${person.first_name} ${person.last_name}`,
                          selectedChatType
                        )}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {person.first_name} {person.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedChatType === 'teacher' ? 'ครูพี่เลี้ยง' : 'อาจารย์นิเทศ'}
                            {person.school_name && ` • ${person.school_name}`}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    
                    {(selectedChatType === 'teacher' ? availableTeachers : availableSupervisors).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="mt-2">
                          {selectedChatType === 'teacher' 
                            ? 'ไม่พบครูพี่เลี้ยงในโรงเรียนที่คุณสังกัด' 
                            : 'ไม่พบอาจารย์นิเทศ'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LoggedLayout>
  );
};

export default Messages;

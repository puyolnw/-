import { apiService } from './api';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  message_type: string;
  file_path?: string;
  file_name?: string;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_role?: string;
  receiver_first_name?: string;
  receiver_last_name?: string;
  receiver_role?: string;
}

export interface Conversation {
  id: number;
  participant_1: number;
  participant_2: number;
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

class ChatApiService {
  // ส่งข้อความ
  async sendMessage(receiverId: number, message: string, messageType: string = 'text'): Promise<{ success: boolean; data?: Message; message?: string }> {
    try {
      console.log('🔵 Frontend - Sending message:', { receiverId, message, messageType });
      const response = await apiService.post('/chat/send', {
        receiver_id: receiverId,
        message,
        message_type: messageType
      });
      console.log('🔵 Frontend - Send message response:', response);
      return response;
    } catch (error: any) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  }

  // ดึงรายการการสนทนา
  async getConversations(): Promise<{ success: boolean; data?: Conversation[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching conversations...');
      const response = await apiService.get('/chat/conversations');
      console.log('🔵 Frontend - Conversations response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch conversations'
      };
    }
  }

  // ดึงข้อความในการสนทนา
  async getMessages(userId: number, limit: number = 50, offset: number = 0): Promise<{ success: boolean; data?: Message[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching messages for user:', userId);
      const response = await apiService.get(`/chat/messages/${userId}?limit=${limit}&offset=${offset}`);
      console.log('🔵 Frontend - Messages response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch messages'
      };
    }
  }

  // อัปเดตสถานะการอ่าน
  async markAsRead(messageId: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Marking message as read:', messageId);
      const response = await apiService.put(`/chat/messages/${messageId}/read`);
      console.log('🔵 Frontend - Mark as read response:', response);
      return response;
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark message as read'
      };
    }
  }

  // ลบข้อความ
  async deleteMessage(messageId: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔵 Frontend - Deleting message:', messageId);
      const response = await apiService.delete(`/chat/messages/${messageId}`);
      console.log('🔵 Frontend - Delete message response:', response);
      return response;
    } catch (error: any) {
      console.error('Error deleting message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete message'
      };
    }
  }

  // ดึงจำนวนข้อความที่ยังไม่ได้อ่าน
  async getUnreadCount(): Promise<{ success: boolean; data?: { unread_count: number }; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching unread count...');
      const response = await apiService.get('/chat/unread-count');
      console.log('🔵 Frontend - Unread count response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch unread count'
      };
    }
  }

  // ค้นหาข้อความ
  async searchMessages(searchTerm: string, limit: number = 20, offset: number = 0): Promise<{ success: boolean; data?: Message[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Searching messages:', searchTerm);
      const response = await apiService.get(`/chat/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`);
      console.log('🔵 Frontend - Search messages response:', response);
      return response;
    } catch (error: any) {
      console.error('Error searching messages:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search messages'
      };
    }
  }

  // ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับ supervisor)
  async getAllUsers(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      console.log('🔵 Frontend - Fetching all users');
      const response = await apiService.get('/chat/users');
      console.log('🔵 Frontend - Get all users response:', response);
      return response;
    } catch (error: any) {
      console.error('🔵 Frontend - Error fetching all users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
      };
    }
  }
}

export const chatApiService = new ChatApiService();

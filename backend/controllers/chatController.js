const ChatMessage = require('../models/ChatMessage');
const { pool } = require('../config/database');

// ส่งข้อความใหม่
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, message, message_type = 'text' } = req.body;
    const sender_id = req.user.id;

    console.log('🔵 Backend - Send message request:', { sender_id, receiver_id, message, message_type });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!receiver_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required'
      });
    }

    // สร้างข้อความ
    const messageData = {
      sender_id,
      receiver_id,
      message,
      message_type
    };

    const newMessage = await ChatMessage.create(messageData);
    console.log('🔵 Backend - Message created:', newMessage);

    // สร้างหรืออัปเดตการสนทนา
    await ChatMessage.createOrUpdateConversation(sender_id, receiver_id, newMessage.id);

    // ดึงข้อความที่สร้างใหม่พร้อมข้อมูลผู้ใช้
    const messageWithDetails = await ChatMessage.findById(newMessage.id);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: messageWithDetails
    });
  } catch (error) {
    console.error('🔵 Backend - Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// ดึงรายการการสนทนา
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🔵 Backend - Get conversations for user:', userId);

    const conversations = await ChatMessage.getConversations(userId);
    console.log('🔵 Backend - Conversations found:', conversations.length);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

// ดึงข้อความในการสนทนา
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    console.log('🔵 Backend - Get messages between:', currentUserId, 'and', userId);

    const messages = await ChatMessage.getConversation(
      currentUserId, 
      parseInt(userId), 
      { limit: parseInt(limit), offset: parseInt(offset) }
    );

    console.log('🔵 Backend - Messages found:', messages.length);

    // อัปเดตสถานะการอ่าน
    await ChatMessage.markConversationAsRead(parseInt(userId), currentUserId);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// อัปเดตสถานะการอ่าน
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    console.log('🔵 Backend - Mark message as read:', messageId, 'for user:', userId);

    const updated = await ChatMessage.markAsRead(parseInt(messageId), userId);

    if (updated) {
      res.json({
        success: true,
        message: 'Message marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Message not found or already read'
      });
    }
  } catch (error) {
    console.error('🔵 Backend - Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
};

// ลบข้อความ
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    console.log('🔵 Backend - Delete message:', messageId, 'by user:', userId);

    const deleted = await ChatMessage.deleteMessage(parseInt(messageId), userId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Message not found or not owned by user'
      });
    }
  } catch (error) {
    console.error('🔵 Backend - Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// ดึงจำนวนข้อความที่ยังไม่ได้อ่าน
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🔵 Backend - Get unread count for user:', userId);

    const unreadCount = await ChatMessage.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unread_count: unreadCount }
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};

// ค้นหาข้อความ
const searchMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q: searchTerm, limit = 20, offset = 0 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    console.log('🔵 Backend - Search messages for user:', userId, 'term:', searchTerm);

    const messages = await ChatMessage.searchMessages(
      userId, 
      searchTerm, 
      { limit: parseInt(limit), offset: parseInt(offset) }
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('🔵 Backend - Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
};

// ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ (สำหรับ supervisor)
const getAllUsers = async (req, res) => {
  try {
    console.log('🔵 Backend - getAllUsers called, req.user:', req.user);
    const currentUserId = req.user.id;
    console.log('🔵 Backend - currentUserId:', currentUserId);
    
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.student_code,
        u.faculty,
        u.major,
        u.phone,
        CASE 
          WHEN u.role = 'student' THEN CONCAT('นักศึกษา - ', u.student_code)
          WHEN u.role = 'teacher' THEN CONCAT('ครูพี่เลี้ยง - ', u.first_name, ' ', u.last_name)
          WHEN u.role = 'supervisor' THEN CONCAT('อาจารย์นิเทศ - ', u.first_name, ' ', u.last_name)
          WHEN u.role = 'admin' THEN CONCAT('ผู้ดูแลระบบ - ', u.first_name, ' ', u.last_name)
          ELSE CONCAT(u.first_name, ' ', u.last_name)
        END as display_name
      FROM users u
      WHERE u.id != ?
      ORDER BY u.role, u.first_name, u.last_name
    `, [currentUserId]);

    console.log('🔵 Backend - users query result:', users);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching all users:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
    });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  getAllUsers
};

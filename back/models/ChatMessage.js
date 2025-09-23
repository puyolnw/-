const { pool } = require('../config/database');

class ChatMessage {
  // สร้างข้อความใหม่
  static async create(messageData) {
    const {
      sender_id,
      receiver_id,
      message,
      message_type = 'text',
      file_path = null,
      file_name = null
    } = messageData;

    const query = `
      INSERT INTO chat_messages (
        sender_id, receiver_id, message, message_type, file_path, file_name
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [sender_id, receiver_id, message, message_type, file_path, file_name];

    try {
      const [result] = await pool.execute(query, values);
      return { id: result.insertId, ...messageData };
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw error;
    }
  }

  // ดึงข้อความระหว่างผู้ใช้สองคน
  static async getConversation(user1Id, user2Id, options = {}) {
    const { limit = 50, offset = 0, before_message_id = null } = options;
    
    let query = `
      SELECT 
        cm.*,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        sender.role as sender_role,
        receiver.first_name as receiver_first_name,
        receiver.last_name as receiver_last_name,
        receiver.role as receiver_role
      FROM chat_messages cm
      LEFT JOIN users sender ON cm.sender_id = sender.id
      LEFT JOIN users receiver ON cm.receiver_id = receiver.id
      WHERE (
        (cm.sender_id = ? AND cm.receiver_id = ?) OR 
        (cm.sender_id = ? AND cm.receiver_id = ?)
      ) AND cm.is_deleted = 0
    `;
    
    const params = [user1Id, user2Id, user2Id, user1Id];

    if (before_message_id) {
      query += ' AND cm.id < ?';
      params.push(before_message_id);
    }

    query += ' ORDER BY cm.sent_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await pool.execute(query, params);
      return rows.reverse(); // เรียงลำดับจากเก่าไปใหม่
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // ดึงรายการการสนทนาของผู้ใช้
  static async getConversations(userId) {
    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN c.participant_1 = ? THEN c.participant_2
          ELSE c.participant_1
        END as other_user_id,
        other_user.first_name as other_user_first_name,
        other_user.last_name as other_user_last_name,
        other_user.role as other_user_role,
        other_user.profile_image as other_user_profile_image,
        last_msg.message as last_message,
        last_msg.message_type as last_message_type,
        last_msg.sent_at as last_message_time,
        last_msg.sender_id as last_message_sender_id,
        unread_count.unread_count
      FROM conversations c
      LEFT JOIN users other_user ON (
        CASE 
          WHEN c.participant_1 = ? THEN c.participant_2
          ELSE c.participant_1
        END
      ) = other_user.id
      LEFT JOIN chat_messages last_msg ON c.last_message_id = last_msg.id
      LEFT JOIN (
        SELECT 
          sender_id,
          receiver_id,
          COUNT(*) as unread_count
        FROM chat_messages 
        WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0
        GROUP BY sender_id, receiver_id
      ) unread_count ON (
        (c.participant_1 = ? AND unread_count.sender_id = c.participant_2) OR
        (c.participant_2 = ? AND unread_count.sender_id = c.participant_1)
      )
      WHERE (c.participant_1 = ? OR c.participant_2 = ?)
        AND c.is_archived = 0
      ORDER BY c.last_activity DESC
    `;

    try {
      const [rows] = await pool.execute(query, [userId, userId, userId, userId, userId, userId, userId]);
      return rows;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // สร้างหรืออัปเดตการสนทนา
  static async createOrUpdateConversation(user1Id, user2Id, lastMessageId) {
    const query = `
      INSERT INTO conversations (participant_1, participant_2, last_message_id, last_activity)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        last_message_id = VALUES(last_message_id),
        last_activity = NOW()
    `;

    // ตรวจสอบลำดับผู้ใช้เพื่อให้ participant_1 < participant_2 เสมอ
    const [participant1, participant2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    try {
      const [result] = await pool.execute(query, [participant1, participant2, lastMessageId]);
      return result;
    } catch (error) {
      console.error('Error creating/updating conversation:', error);
      throw error;
    }
  }

  // อัปเดตสถานะการอ่าน
  static async markAsRead(messageId, userId) {
    const query = `
      UPDATE chat_messages 
      SET is_read = 1, read_at = NOW()
      WHERE id = ? AND receiver_id = ? AND is_read = 0
    `;

    try {
      const [result] = await pool.execute(query, [messageId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // อัปเดตสถานะการอ่านสำหรับการสนทนา
  static async markConversationAsRead(senderId, receiverId) {
    const query = `
      UPDATE chat_messages 
      SET is_read = 1, read_at = NOW()
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0 AND is_deleted = 0
    `;

    try {
      const [result] = await pool.execute(query, [senderId, receiverId]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  // ลบข้อความ
  static async deleteMessage(messageId, userId) {
    const query = `
      UPDATE chat_messages 
      SET is_deleted = 1, deleted_at = NOW()
      WHERE id = ? AND sender_id = ?
    `;

    try {
      const [result] = await pool.execute(query, [messageId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // ดึงข้อความตาม ID
  static async findById(id) {
    const query = `
      SELECT 
        cm.*,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        sender.role as sender_role,
        receiver.first_name as receiver_first_name,
        receiver.last_name as receiver_last_name,
        receiver.role as receiver_role
      FROM chat_messages cm
      LEFT JOIN users sender ON cm.sender_id = sender.id
      LEFT JOIN users receiver ON cm.receiver_id = receiver.id
      WHERE cm.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching message by ID:', error);
      throw error;
    }
  }

  // ตรวจสอบว่าเป็นเจ้าของข้อความหรือไม่
  static async isOwnedByUser(messageId, userId) {
    const query = 'SELECT id FROM chat_messages WHERE id = ? AND sender_id = ?';

    try {
      const [rows] = await pool.execute(query, [messageId, userId]);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking message ownership:', error);
      throw error;
    }
  }

  // ดึงจำนวนข้อความที่ยังไม่ได้อ่าน
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM chat_messages 
      WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0
    `;

    try {
      const [rows] = await pool.execute(query, [userId]);
      return rows[0].unread_count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // ค้นหาข้อความ
  static async searchMessages(userId, searchTerm, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    const query = `
      SELECT 
        cm.*,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        sender.role as sender_role,
        receiver.first_name as receiver_first_name,
        receiver.last_name as receiver_last_name,
        receiver.role as receiver_role
      FROM chat_messages cm
      LEFT JOIN users sender ON cm.sender_id = sender.id
      LEFT JOIN users receiver ON cm.receiver_id = receiver.id
      WHERE (
        (cm.sender_id = ? OR cm.receiver_id = ?) AND
        cm.message LIKE ? AND
        cm.is_deleted = 0
      )
      ORDER BY cm.sent_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const [rows] = await pool.execute(query, [userId, userId, `%${searchTerm}%`, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
}

module.exports = ChatMessage;

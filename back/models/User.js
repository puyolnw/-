const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // ค้นหาผู้ใช้ด้วย username
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ค้นหาผู้ใช้ด้วย email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ค้นหาผู้ใช้ด้วย ID
  static async findById(id) {
    try {
      console.log('🔵 Backend - User.findById called with ID:', id);
      
      // ตรวจสอบว่า id เป็น undefined หรือไม่
      if (id === undefined || id === null) {
        throw new Error('User ID cannot be undefined or null');
      }
      
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      
      console.log('🔵 Backend - User.findById result:', rows[0]);
      return rows[0];
    } catch (error) {
      console.error('🔵 Backend - User.findById error:', error);
      throw error;
    }
  }

  // สร้างผู้ใช้ใหม่
  static async create(userData) {
    const {
      user_id,
      role,
      first_name,
      last_name,
      phone,
      email,
      address,
      username,
      password,
      school_id,
      student_code,
      faculty,
      major,
      profile_image
    } = userData;

    try {
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // สร้าง query แบบ dynamic ตามฟิลด์ที่มี
      const fields = ['user_id', 'role', 'first_name', 'last_name', 'phone', 'email', 'address', 'username', 'password'];
      const values = [user_id, role, first_name, last_name, phone, email, address, username, hashedPassword];
      
        // ไม่เพิ่ม school_id เพื่อป้องกัน foreign key constraint error
        // if (school_id) {
        //   fields.push('school_id');
        //   values.push(school_id);
        // }
      
      if (student_code) {
        fields.push('student_code');
        values.push(student_code);
      }
      
      if (faculty) {
        fields.push('faculty');
        values.push(faculty);
      }
      
      if (major) {
        fields.push('major');
        values.push(major);
      }
      
      if (profile_image) {
        fields.push('profile_image');
        values.push(profile_image);
      }
      
      const placeholders = fields.map(() => '?').join(', ');
      const query = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;

      const [result] = await pool.execute(query, values);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // อัพเดทข้อมูลผู้ใช้
  static async update(id, userData) {
    const {
      first_name,
      last_name,
      phone,
      email,
      address,
      school_id,
      student_code,
      faculty,
      major,
      profile_image,
      advisor_name,
      advisor_phone,
      father_name,
      father_occupation,
      father_phone,
      mother_name,
      mother_occupation,
      mother_phone
    } = userData;

    try {
      // สร้าง dynamic query ตามฟิลด์ที่มี
      const fields = [];
      const values = [];

      if (first_name !== undefined) {
        fields.push('first_name = ?');
        values.push(first_name);
      }
      if (last_name !== undefined) {
        fields.push('last_name = ?');
        values.push(last_name);
      }
      if (phone !== undefined) {
        fields.push('phone = ?');
        values.push(phone);
      }
      if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
      }
      if (address !== undefined) {
        fields.push('address = ?');
        values.push(address);
      }
      // ลบการอัพเดท school_id เพื่อป้องกัน foreign key constraint error
      // if (school_id !== undefined) {
      //   fields.push('school_id = ?');
      //   values.push(school_id);
      // }
      if (student_code !== undefined) {
        fields.push('student_code = ?');
        values.push(student_code);
      }
      if (faculty !== undefined) {
        fields.push('faculty = ?');
        values.push(faculty);
      }
      if (major !== undefined) {
        fields.push('major = ?');
        values.push(major);
      }
      if (profile_image !== undefined) {
        fields.push('profile_image = ?');
        values.push(profile_image);
      }
      
      // ฟิลด์สำหรับข้อมูลบุคคลอ้างอิง
      if (advisor_name !== undefined) {
        fields.push('advisor_name = ?');
        values.push(advisor_name);
      }
      if (advisor_phone !== undefined) {
        fields.push('advisor_phone = ?');
        values.push(advisor_phone);
      }
      if (father_name !== undefined) {
        fields.push('father_name = ?');
        values.push(father_name);
      }
      if (father_occupation !== undefined) {
        fields.push('father_occupation = ?');
        values.push(father_occupation);
      }
      if (father_phone !== undefined) {
        fields.push('father_phone = ?');
        values.push(father_phone);
      }
      if (mother_name !== undefined) {
        fields.push('mother_name = ?');
        values.push(mother_name);
      }
      if (mother_occupation !== undefined) {
        fields.push('mother_occupation = ?');
        values.push(mother_occupation);
      }
      if (mother_phone !== undefined) {
        fields.push('mother_phone = ?');
        values.push(mother_phone);
      }

      if (fields.length === 0) {
        return true; // ไม่มีอะไรให้อัปเดต
      }

      values.push(id); // เพิ่ม id สำหรับ WHERE clause

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await pool.execute(query, values);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // เปลี่ยนรหัสผ่าน
  static async updatePassword(id, newPassword) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const [result] = await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ตรวจสอบรหัสผ่าน
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  // ดึงข้อมูลผู้ใช้ทั้งหมดตาม role
  static async findByRole(role) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, user_id, role, first_name, last_name, phone, email, address, username, school_id, created_at FROM users WHERE role = ?',
        [role]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ลบผู้ใช้
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // สร้าง user_id อัตโนมัติตาม role
  static async generateUserId(role) {
    try {
      let prefix;
      switch (role) {
        case 'student':
          prefix = 'STD';
          break;
        case 'teacher':
          prefix = 'TCH';
          break;
        case 'supervisor':
          prefix = 'SUP';
          break;
        case 'admin':
          prefix = 'ADM';
          break;
        default:
          prefix = 'USR';
      }

      // ใช้ transaction เพื่อป้องกัน race condition
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // หาเลขล่าสุดของ role นั้น (เฉพาะที่ขึ้นต้นด้วย prefix ที่ถูกต้อง)
        const [rows] = await connection.execute(
          'SELECT user_id FROM users WHERE role = ? AND user_id LIKE ? ORDER BY user_id DESC LIMIT 1 FOR UPDATE',
          [role, `${prefix}%`]
        );

        let nextNumber = 1;
        if (rows.length > 0) {
          const lastId = rows[0].user_id;
          // ตรวจสอบว่า user_id มีรูปแบบที่ถูกต้อง (prefix + ตัวเลข)
          if (lastId.startsWith(prefix) && lastId.length > prefix.length) {
            const numberPart = parseInt(lastId.substring(prefix.length));
            if (!isNaN(numberPart)) {
              nextNumber = numberPart + 1;
            }
          }
        }

        const newUserId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
        
        // ตรวจสอบว่า user_id นี้มีอยู่แล้วหรือไม่
        const [existingUser] = await connection.execute(
          'SELECT id FROM users WHERE user_id = ?',
          [newUserId]
        );

        if (existingUser.length > 0) {
          // ถ้ามีอยู่แล้ว ให้เพิ่มเลขขึ้น
          nextNumber++;
          const finalUserId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
          await connection.commit();
          connection.release();
          return finalUserId;
        }

        await connection.commit();
        connection.release();
        return newUserId;
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // ลบผู้ใช้
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;

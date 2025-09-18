const { pool } = require('../config/database');

class School {
  // สร้างโรงเรียนใหม่
  static async create(schoolData) {
    const {
      school_id,
      school_name,
      address,
      phone
    } = schoolData;

    try {
      const [result] = await pool.execute(
        `INSERT INTO schools (school_id, school_name, address, phone) 
         VALUES (?, ?, ?, ?)`,
        [school_id, school_name, address, phone]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // ค้นหาโรงเรียนตาม ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM schools WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ค้นหาโรงเรียนตาม school_id
  static async findBySchoolId(school_id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM schools WHERE school_id = ?',
        [school_id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ค้นหาโรงเรียนตาม school_name
  static async findByName(school_name) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM schools WHERE school_name = ?',
        [school_name]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ดึงโรงเรียนทั้งหมด
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM schools ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // อัพเดทโรงเรียน
  static async update(id, schoolData) {
    const {
      school_name,
      address,
      phone
    } = schoolData;

    try {
      // สร้าง dynamic query ตามฟิลด์ที่มี
      const fields = [];
      const values = [];

      if (school_name !== undefined) {
        fields.push('school_name = ?');
        values.push(school_name);
      }
      if (address !== undefined) {
        fields.push('address = ?');
        values.push(address);
      }
      if (phone !== undefined) {
        fields.push('phone = ?');
        values.push(phone);
      }

      if (fields.length === 0) {
        return true; // ไม่มีอะไรให้อัปเดต
      }

      // เพิ่ม updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id); // เพิ่ม id สำหรับ WHERE clause

      const query = `UPDATE schools SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await pool.execute(query, values);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ลบโรงเรียน
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM schools WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // สร้าง school_id อัตโนมัติ
  static async generateSchoolId() {
    try {
      const [rows] = await pool.execute(
        'SELECT school_id FROM schools ORDER BY id DESC LIMIT 1'
      );

      let nextNumber = 1;
      if (rows.length > 0) {
        const lastId = rows[0].school_id;
        const numberPart = parseInt(lastId.substring(3)); // SCH001 -> 1
        nextNumber = numberPart + 1;
      }

      return `SCH${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติโรงเรียน
  static async getStats() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_added,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_added
        FROM schools
      `);

      return stats[0];
    } catch (error) {
      throw error;
    }
  }

  // ค้นหาโรงเรียนด้วยเงื่อนไขต่างๆ
  static async search(searchParams) {
    const { search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = searchParams;
    
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      const queryParams = [];

      // Search functionality
      if (search) {
        whereClause += ' WHERE (school_name LIKE ? OR school_id LIKE ? OR address LIKE ?)';
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Sorting
      const allowedSortFields = ['school_name', 'school_id', 'created_at', 'updated_at'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM schools${whereClause}`;
      const [countResult] = await pool.execute(countQuery, queryParams);
      const total = countResult[0].total;

      // Get schools with pagination
      const schoolsQuery = `
        SELECT * FROM schools
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(parseInt(limit), parseInt(offset));
      const [schools] = await pool.execute(schoolsQuery, queryParams);

      return {
        schools,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < Math.ceil(total / limit),
          hasPrevPage: parseInt(page) > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = School;

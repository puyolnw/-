const School = require('../models/School');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

// ดึงรายการโรงเรียนทั้งหมด (สำหรับ Admin)
const getAllSchools = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
    const searchParams = {
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const result = await School.search(searchParams);

    res.json({
      success: true,
      data: {
        schools: result.schools,
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Get all schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงข้อมูลโรงเรียนตาม ID (สำหรับ Admin)
const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      data: { school }
    });

  } catch (error) {
    console.error('Get school by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// สร้างโรงเรียนใหม่ (สำหรับ Admin)
const createSchool = async (req, res) => {
  try {
    // ตรวจสอบ validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      school_name,
      address,
      phone
    } = req.body;

    // ตรวจสอบว่า school_name ไม่ซ้ำ
    const existingSchool = await School.findByName(school_name);
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School name already exists'
      });
    }

    // สร้าง school_id อัตโนมัติ
    const school_id = await School.generateSchoolId();

    // สร้างข้อมูลโรงเรียน
    const schoolData = {
      school_id,
      school_name,
      address,
      phone: phone || null
    };

    const newSchoolId = await School.create(schoolData);
    const newSchool = await School.findById(newSchoolId);

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: { school: newSchool }
    });

  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// อัพเดทโรงเรียน (สำหรับ Admin)
const updateSchool = async (req, res) => {
  try {
    // ตรวจสอบ validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      school_name,
      address,
      phone
    } = req.body;

    // ตรวจสอบว่าโรงเรียนมีอยู่
    const existingSchool = await School.findById(id);
    if (!existingSchool) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // ตรวจสอบว่า school_name ไม่ซ้ำกับโรงเรียนอื่น
    if (school_name && school_name !== existingSchool.school_name) {
      const nameExists = await School.findByName(school_name);
      if (nameExists && nameExists.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'School name already exists'
        });
      }
    }

    // อัพเดทข้อมูล
    const updateData = {
      school_name,
      address,
      phone: phone || null
    };

    const updated = await School.update(id, updateData);
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update school'
      });
    }

    // ดึงข้อมูลที่อัพเดทแล้ว
    const updatedSchool = await School.findById(id);

    res.json({
      success: true,
      message: 'School updated successfully',
      data: { school: updatedSchool }
    });

  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ลบโรงเรียน (สำหรับ Admin)
const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่าโรงเรียนมีอยู่
    const existingSchool = await School.findById(id);
    if (!existingSchool) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // ตรวจสอบว่ามีผู้ใช้ที่เชื่อมโยงกับโรงเรียนนี้หรือไม่
    const [users] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE school_id = ?',
      [existingSchool.school_id]
    );

    const associatedUsersCount = users[0].count;

    // ถ้ามี users เชื่อมโยง ให้ตั้งค่า school_id เป็น NULL ก่อน
    if (associatedUsersCount > 0) {
      console.log(`Updating ${associatedUsersCount} users to remove school reference before deleting school`);
      await pool.execute(
        'UPDATE users SET school_id = NULL WHERE school_id = ?',
        [existingSchool.school_id]
      );
    }

    // ลบโรงเรียน
    const deleted = await School.delete(id);
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete school'
      });
    }

    res.json({
      success: true,
      message: associatedUsersCount > 0 
        ? `School deleted successfully. ${associatedUsersCount} users were updated to remove school reference.`
        : 'School deleted successfully'
    });

  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงสถิติโรงเรียน (สำหรับ Admin Dashboard)
const getSchoolStats = async (req, res) => {
  try {
    const stats = await School.getStats();

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get school stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats
};

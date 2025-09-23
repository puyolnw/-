const { pool } = require('../config/database');

// Get all academic years
const getAllAcademicYears = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_years ORDER BY year DESC, semester DESC'
    );

    res.json({
      success: true,
      data: { academicYears: rows }
    });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get active academic year
const getActiveAcademicYear = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_years WHERE is_active = true LIMIT 1'
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active academic year found'
      });
    }

    res.json({
      success: true,
      data: { academicYear: rows[0] }
    });
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get academic year by ID
const getAcademicYearById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }

    res.json({
      success: true,
      data: { academicYear: rows[0] }
    });
  } catch (error) {
    console.error('Error fetching academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new academic year
const createAcademicYear = async (req, res) => {
  try {
    const { year, semester, start_date, end_date, registration_start, registration_end, is_active } = req.body;

    // Check if academic year already exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM academic_years WHERE year = ? AND semester = ?',
      [year, semester]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Academic year already exists'
      });
    }

    // If setting as active, deactivate all other years
    if (is_active) {
      await pool.execute(
        'UPDATE academic_years SET is_active = false WHERE is_active = true'
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO academic_years (year, semester, start_date, end_date, registration_start, registration_end, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [year, semester, start_date, end_date, registration_start, registration_end, is_active || false]
    );

    const [newYear] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: { academicYear: newYear[0] },
      message: 'Academic year created successfully'
    });
  } catch (error) {
    console.error('Error creating academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update academic year
const updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, semester, start_date, end_date, registration_start, registration_end, is_active } = req.body;

    // Check if academic year exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }

    // Check if academic year already exists (excluding current one)
    if (year && semester) {
      const [duplicateRows] = await pool.execute(
        'SELECT * FROM academic_years WHERE year = ? AND semester = ? AND id != ?',
        [year, semester, id]
      );

      if (duplicateRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Academic year already exists'
        });
      }
    }

    // If setting as active, deactivate all other years
    if (is_active) {
      await pool.execute(
        'UPDATE academic_years SET is_active = false WHERE is_active = true'
      );
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (year !== undefined) {
      updateFields.push('year = ?');
      updateValues.push(year);
    }
    if (semester !== undefined) {
      updateFields.push('semester = ?');
      updateValues.push(semester);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      updateValues.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      updateValues.push(end_date);
    }
    if (registration_start !== undefined) {
      updateFields.push('registration_start = ?');
      updateValues.push(registration_start);
    }
    if (registration_end !== undefined) {
      updateFields.push('registration_end = ?');
      updateValues.push(registration_end);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE academic_years SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updatedYear] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: { academicYear: updatedYear[0] },
      message: 'Academic year updated successfully'
    });
  } catch (error) {
    console.error('Error updating academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Activate academic year
const activateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if academic year exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }

    // Deactivate all other years
    await pool.execute(
      'UPDATE academic_years SET is_active = false WHERE is_active = true'
    );

    // Activate the selected year
    await pool.execute(
      'UPDATE academic_years SET is_active = true WHERE id = ?',
      [id]
    );

    const [activatedYear] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: { academicYear: activatedYear[0] },
      message: 'Academic year activated successfully'
    });
  } catch (error) {
    console.error('Error activating academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete academic year
const deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if academic year exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }

    // Don't allow deletion of active academic year
    if (existingRows[0].is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active academic year'
      });
    }

    await pool.execute(
      'DELETE FROM academic_years WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Academic year deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get academic year statistics
const getAcademicYearStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if academic year exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM academic_years WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }

    // Get statistics
    const [schoolStats] = await pool.execute(`
      SELECT COUNT(DISTINCT school_id) as total_schools
      FROM school_quotas 
      WHERE academic_year_id = ?
    `, [id]);

    const [studentStats] = await pool.execute(`
      SELECT COUNT(*) as total_students
      FROM internship_assignments 
      WHERE academic_year_id = ?
    `, [id]);

    const [teacherStats] = await pool.execute(`
      SELECT COUNT(DISTINCT teacher_id) as total_teachers
      FROM school_teachers 
      WHERE academic_year_id = ?
    `, [id]);

    const [assignmentStats] = await pool.execute(`
      SELECT COUNT(*) as active_assignments
      FROM internship_assignments 
      WHERE academic_year_id = ? AND status = 'active'
    `, [id]);

    const stats = {
      total_schools: schoolStats[0].total_schools,
      total_students: studentStats[0].total_students,
      total_teachers: teacherStats[0].total_teachers,
      active_assignments: assignmentStats[0].active_assignments
    };

    res.json({
      success: true,
      data: { 
        academicYear: existingRows[0],
        stats 
      }
    });
  } catch (error) {
    console.error('Error fetching academic year stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllAcademicYears,
  getActiveAcademicYear,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deleteAcademicYear,
  getAcademicYearStats
};
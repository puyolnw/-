const { validationResult } = require('express-validator');

// Middleware สำหรับจัดการ validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('🔴 Validation errors:', errors.array());
    
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ 
      field: err.param, 
      message: err.msg,
      value: err.value 
    }));

    console.log('🔴 Extracted validation errors:', extractedErrors);

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors
    });
  }
  
  next();
};

// Sanitize input middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts from string fields
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove script tags and other potentially dangerous content
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }

  next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive integer'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be a positive integer between 1 and 100'
    });
  }
  
  req.query.page = pageNum;
  req.query.limit = limitNum;
  
  next();
};

// Validate sort parameters
const validateSort = (allowedFields) => (req, res, next) => {
  const { sortBy, sortOrder = 'desc' } = req.query;
  
  if (sortBy && !allowedFields.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
    });
  }
  
  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Sort order must be either "asc" or "desc"'
    });
  }
  
  next();
};

// Validate ID parameter
const validateId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id)) || parseInt(id) < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID parameter'
    });
  }
  
  req.params.id = parseInt(id);
  next();
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  validatePagination,
  validateSort,
  validateId
};

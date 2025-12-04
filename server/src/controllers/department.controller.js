const Department = require('../models/Department');

// Get all departments
exports.getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('hodId', 'firstName lastName email')
      .sort({ name: 1 });
    
    res.json({
      status: 'success',
      data: { departments },
    });
  } catch (error) {
    next(error);
  }
};

// Get department by ID
exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('hodId', 'firstName lastName email');
    
    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

// Create department
exports.createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

// Update department
exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('hodId', 'firstName lastName email');
    
    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

// Delete department (soft delete)
exports.deleteDepartment = async (req, res, next) => {
  try {
    // SUPER_ADMIN can permanently delete, others do soft delete
    if (req.user.role === 'SUPER_ADMIN') {
      const department = await Department.findByIdAndDelete(req.params.id);
      
      if (!department) {
        return res.status(404).json({
          status: 'error',
          message: 'Department not found',
        });
      }
    } else {
      const department = await Department.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!department) {
        return res.status(404).json({
          status: 'error',
          message: 'Department not found',
        });
      }
    }
    
    res.json({
      status: 'success',
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

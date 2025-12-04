const Faculty = require('../models/Faculty');
const User = require('../models/User');
// Ensure dependent models registered for population
require('../models/Department');

// GET /api/faculty
exports.getAllFaculty = async (req, res, next) => {
  try {
    const { departmentId, isActive } = req.query;
    const filter = {};

    // Optional department scoping for HOD/Faculty
    const userRole = req.user?.role;
    const userDept = req.user?.departmentId;
    
    // SUPER_ADMIN can see all faculty
    if (userRole === 'SUPER_ADMIN') {
      // No department filter - see everything
      if (departmentId) filter.departmentId = departmentId;
    } else if (userRole === 'HOD' || userRole === 'FACULTY') {
      if (userDept) filter.departmentId = userDept;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    const faculty = await Faculty.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('departmentId', 'name code')
      .sort({ employeeId: 1 });

    res.json({ status: 'success', data: { faculty } });
  } catch (err) {
    next(err);
  }
};

// POST /api/faculty
exports.createFaculty = async (req, res, next) => {
  try {
    const { userData, facultyData } = req.body;
    if (!userData || !facultyData) {
      return res.status(400).json({ status: 'error', message: 'userData and facultyData are required' });
    }

    // Set default password
    const defaultPassword = 'Password123';

    // Create User with FACULTY role
    const user = await User.create({
      ...userData,
      password: defaultPassword,
      role: 'FACULTY'
    });

    // Create Faculty record
    const faculty = await Faculty.create({
      ...facultyData,
      userId: user._id
    });

    const populated = await Faculty.findById(faculty._id)
      .populate('userId', 'firstName lastName email phone')
      .populate('departmentId', 'name code');

    res.status(201).json({ 
      status: 'success', 
      data: { faculty: populated },
      message: 'Faculty created with default password: Password123'
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/faculty/:id
exports.getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('departmentId', 'name code');
    if (!faculty) {
      return res.status(404).json({ status: 'error', message: 'Faculty not found' });
    }
    res.json({ status: 'success', data: { faculty } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/faculty/:id
exports.updateFaculty = async (req, res, next) => {
  try {
    const { userData, facultyData } = req.body;
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ status: 'error', message: 'Faculty not found' });
    }

    // Update user if userData present
    if (userData && faculty.userId) {
      await User.findByIdAndUpdate(faculty.userId, userData, { runValidators: true });
    }

    // Update faculty
    if (facultyData) {
      Object.assign(faculty, facultyData);
      await faculty.save();
    }

    const updated = await Faculty.findById(faculty._id)
      .populate('userId', 'firstName lastName email phone')
      .populate('departmentId', 'name code');

    res.json({ status: 'success', data: { faculty: updated } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/faculty/:id
exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ status: 'error', message: 'Faculty not found' });
    }
    await Faculty.findByIdAndDelete(req.params.id);
    if (faculty.userId) {
      await User.findByIdAndDelete(faculty.userId);
    }
    res.json({ status: 'success', message: 'Faculty deleted' });
  } catch (err) {
    next(err);
  }
};

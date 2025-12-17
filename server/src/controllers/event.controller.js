const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const EventView = require('../models/EventView');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const PhaseIISubmission = require('../models/PhaseIISubmission');
const { notifyEventCreation } = require('../services/notification.service');

// Get all events
exports.getAllEvents = async (req, res, next) => {
  try {
    const { status, eventType, eventLevel, departmentId } = req.query;
    const filter = { isDeleted: false };
    
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;
    if (eventLevel) filter.eventLevel = eventLevel;
    if (departmentId) filter.departmentId = departmentId;
    
    // Filter based on user role and visibility
    // Students and Faculty can see:
    // 1. INSTITUTION-wide events (visible to all)
    // 2. DEPARTMENT events from their department
    // 3. EXTERNAL events (open to all)
    // SUPER_ADMIN and HOD can see all events
    if (req.user.role === 'STUDENT' || req.user.role === 'FACULTY') {
      filter.$or = [
        { visibility: 'INSTITUTION' },
        { visibility: 'EXTERNAL' },
        { visibility: 'DEPARTMENT', departmentId: req.user.departmentId },
      ];
    }
    
    const events = await Event.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('departmentId', 'name code')
      .sort({ startDate: -1 });
    
    res.json({
      status: 'success',
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};

// Get event by ID
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('departmentId', 'name code');
    
    if (!event || event.isDeleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }

    // Track event view
    await trackEventView(req.params.id, req.user);
    
    res.json({
      status: 'success',
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to track event views
async function trackEventView(eventId, user) {
  try {
    // Only track views for STUDENT and FACULTY roles
    const userType = user.role === 'STUDENT' ? 'STUDENT' : user.role === 'FACULTY' ? 'FACULTY' : null;
    
    // Don't track views for SUPER_ADMIN, HOD, etc.
    if (!userType) {
      console.log(`Skipping view tracking for role: ${user.role}`);
      return;
    }

    const viewData = {
      eventId,
      userId: user._id,
      userType,
    };

    // Ensure we properly get and save the student/faculty ID
    if (userType === 'STUDENT') {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        viewData.studentId = student._id;
      } else {
        console.warn(`No student record found for userId: ${user._id}`);
        return; // Don't track if no student record found
      }
    } else if (userType === 'FACULTY') {
      const faculty = await Faculty.findOne({ userId: user._id });
      if (faculty) {
        viewData.facultyId = faculty._id;
      } else {
        console.warn(`No faculty record found for userId: ${user._id}`);
        return; // Don't track if no faculty record found
      }
    }

    // Check if this user has already viewed this event
    const existingView = await EventView.findOne({ eventId, userId: user._id });
    
    if (!existingView) {
      // First time viewing - create new record and increment event count
      await EventView.create({
        ...viewData,
        viewCount: 1,
        lastViewedAt: new Date(),
      });
      
      // Increment event view count only for new views
      await Event.findByIdAndUpdate(eventId, { $inc: { viewCount: 1 } });
    } else {
      // Already viewed before - just update the view record without incrementing event count
      await EventView.findOneAndUpdate(
        { eventId, userId: user._id },
        {
          lastViewedAt: new Date(),
          $inc: { viewCount: 1 }
        },
        { new: true }
      );
    }
  } catch (error) {
    console.error('Error tracking event view:', error);
  }
}

// Register for event (with duplicate check)
exports.registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    // Get student ID from user
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found',
      });
    }

    // Check if student is already registered
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      studentId: student._id,
    });

    if (existingRegistration) {
      return res.status(409).json({
        status: 'error',
        message: 'You are already registered for this event',
      });
    }

    // Create new registration
    const registration = await EventRegistration.create({
      eventId,
      studentId: student._id,
      registrationType: 'INDIVIDUAL',
      registrationDate: new Date(),
    });

    // Increment event registered count
    const event = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { registeredCount: 1 } },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }

    res.json({
      status: 'success',
      message: 'Successfully registered for the event',
      data: { event, registration },
    });
  } catch (error) {
    next(error);
  }
};

// Create event
exports.createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user._id,
    };
    
    if (req.user.role !== 'SUPER_ADMIN') {
      eventData.departmentId = req.user.departmentId;
    }

    // Record faculty ID if user is faculty or HOD
    if (req.user.role === 'FACULTY' || req.user.role === 'HOD') {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (faculty) {
        eventData.createdByFacultyId = faculty._id;
      }
    }
    
    const event = await Event.create(eventData);
    
    // Notify all users about the new event
    await notifyEventCreation(event, req.user);
    
    res.status(201).json({
      status: 'success',
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

// Update event
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName')
     .populate('departmentId', 'name code');
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

// Delete event
exports.deleteEvent = async (req, res, next) => {
  try {
    // Record deletion with faculty ID
    const deleteData = {
      isDeleted: true,
      deletedBy: req.user._id,
      deletedAt: new Date(),
    };

    // Record faculty ID if user is faculty
    if (req.user.role === 'FACULTY') {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (faculty) {
        deleteData.deletedByFacultyId = faculty._id;
      }
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      deleteData,
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }
    
    res.json({
      status: 'success',
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Publish event
exports.publishEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'PUBLISHED', publishedAt: new Date() },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { event },
      message: 'Event published successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get students who viewed the event
exports.getStudentsWhoViewed = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { departmentId, year, section, search, page = 1, limit = 50 } = req.query;

    const filter = { eventId, userType: 'STUDENT' };
    
    const views = await EventView.find(filter)
      .populate({
        path: 'studentId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'userId', select: 'firstName lastName email' }
        ]
      })
      .sort({ lastViewedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    let students = views
      .filter(v => v.studentId) // Filter out views with null studentId
      .map(v => ({
        ...v.studentId.toObject(),
        viewCount: v.viewCount,
        firstViewedAt: v.viewedAt,
        lastViewedAt: v.lastViewedAt
      }))
      .filter(s => s.rollNumber); // Filter out null student records

    // Apply filters
    if (departmentId) {
      students = students.filter(s => s.departmentId?._id.toString() === departmentId);
    }
    if (year) {
      students = students.filter(s => s.year === parseInt(year));
    }
    if (section) {
      students = students.filter(s => s.section === section);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(s => 
        s.rollNumber?.toLowerCase().includes(searchLower) ||
        s.userId?.firstName?.toLowerCase().includes(searchLower) ||
        s.userId?.lastName?.toLowerCase().includes(searchLower) ||
        s.userId?.email?.toLowerCase().includes(searchLower)
      );
    }

    const total = students.length;

    res.json({
      students,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// Get faculty who viewed the event
exports.getFacultyWhoViewed = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { departmentId, search, page = 1, limit = 50 } = req.query;

    const filter = { eventId, userType: 'FACULTY' };
    
    // Get total count of faculty who viewed (regardless of whether they have facultyId populated)
    const totalCount = await EventView.countDocuments(filter);
    
    const views = await EventView.find(filter)
      .populate({
        path: 'facultyId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'userId', select: 'firstName lastName email' }
        ]
      })
      .sort({ lastViewedAt: -1 });

    let faculty = views
      .filter(v => v.facultyId) // Filter out views with null facultyId
      .map(v => ({
        ...v.facultyId.toObject(),
        viewCount: v.viewCount,
        firstViewedAt: v.viewedAt,
        lastViewedAt: v.lastViewedAt
      }))
      .filter(f => f.employeeId); // Filter out null faculty records

    // Apply filters
    if (departmentId) {
      faculty = faculty.filter(f => f.departmentId?._id.toString() === departmentId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      faculty = faculty.filter(f => 
        f.employeeId?.toLowerCase().includes(searchLower) ||
        f.userId?.firstName?.toLowerCase().includes(searchLower) ||
        f.userId?.lastName?.toLowerCase().includes(searchLower) ||
        f.userId?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination to the filtered results
    const paginatedFaculty = faculty.slice((page - 1) * limit, page * limit);

    res.json({
      faculty: paginatedFaculty,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    next(error);
  }
};

// Get students who registered/clicked register button
exports.getStudentsWhoRegistered = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { departmentId, year, section, participationType, paymentStatus, search, page = 1, limit = 50 } = req.query;

    const filter = { eventId, isCancelled: false };
    
    if (participationType) filter.participationType = participationType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const registrations = await EventRegistration.find(filter)
      .populate({
        path: 'studentId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'userId', select: 'firstName lastName email' }
        ]
      })
      .sort({ registrationDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    let students = registrations.map(r => ({
      ...r.studentId.toObject(),
      registrationDate: r.registrationDate,
      participationType: r.participationType,
      teamName: r.teamName,
      paymentStatus: r.paymentStatus,
      paymentAmount: r.paymentAmount,
      paymentDate: r.paymentDate
    })).filter(s => s.rollNumber); // Filter out null student records

    // Apply filters
    if (departmentId) {
      students = students.filter(s => s.departmentId?._id.toString() === departmentId);
    }
    if (year) {
      students = students.filter(s => s.year === parseInt(year));
    }
    if (section) {
      students = students.filter(s => s.section === section);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(s => 
        s.rollNumber?.toLowerCase().includes(searchLower) ||
        s.userId?.firstName?.toLowerCase().includes(searchLower) ||
        s.userId?.lastName?.toLowerCase().includes(searchLower) ||
        s.teamName?.toLowerCase().includes(searchLower)
      );
    }

    const total = students.length;

    res.json({
      students,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// Get registered but not participated students
exports.getRegisteredButNotParticipated = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { departmentId, year, section, search, page = 1, limit = 50 } = req.query;

    // Get all registered students
    const registrations = await EventRegistration.find({ 
      eventId, 
      isCancelled: false 
    })
      .populate({
        path: 'studentId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'userId', select: 'firstName lastName email' }
        ]
      })
      .sort({ registrationDate: -1 });

    // Get all students who submitted Phase II (participated)
    const phaseIISubmissions = await PhaseIISubmission.find({ 
      eventId,
      status: { $ne: 'DRAFT' }
    }).select('studentId');

    const participatedStudentIds = new Set(
      phaseIISubmissions.map(s => s.studentId.toString())
    );

    // Filter out students who participated
    let students = registrations
      .filter(r => !participatedStudentIds.has(r.studentId?._id.toString()))
      .map(r => ({
        ...r.studentId.toObject(),
        registrationDate: r.registrationDate,
        participationType: r.participationType,
        teamName: r.teamName,
        paymentStatus: r.paymentStatus,
        daysSinceRegistration: Math.floor((Date.now() - new Date(r.registrationDate)) / (1000 * 60 * 60 * 24))
      }))
      .filter(s => s.rollNumber); // Filter out null student records

    // Apply filters
    if (departmentId) {
      students = students.filter(s => s.departmentId?._id.toString() === departmentId);
    }
    if (year) {
      students = students.filter(s => s.year === parseInt(year));
    }
    if (section) {
      students = students.filter(s => s.section === section);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(s => 
        s.rollNumber?.toLowerCase().includes(searchLower) ||
        s.userId?.firstName?.toLowerCase().includes(searchLower) ||
        s.userId?.lastName?.toLowerCase().includes(searchLower) ||
        s.teamName?.toLowerCase().includes(searchLower)
      );
    }

    const total = students.length;
    const paginatedStudents = students.slice((page - 1) * limit, page * limit);

    res.json({
      students: paginatedStudents,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

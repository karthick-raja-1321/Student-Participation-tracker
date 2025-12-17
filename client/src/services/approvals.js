import api from '../utils/api';

// Class Advisor
export const fetchClassAdvisorStats = () => api.get('/approvals/class-advisor-stats');
export const fetchClassAdvisorSubmissions = () => api.get('/approvals/class-advisor-submissions');
export const submitClassAdvisorApproval = ({ submissionId, status, comments, mentorId }) =>
  api.post('/approvals/submit-approval', {
    submissionId,
    status,
    comments,
    mentorId,
    role: 'CLASS_ADVISOR',
  });

// Innovation Coordinator
export const fetchInnovationCoordinatorStats = () =>
  api.get('/approvals/innovation-coordinator-stats');

export const fetchInnovationCoordinatorPhaseI = () =>
  api.get('/approvals/innovation-coordinator-phase-i');

export const fetchInnovationCoordinatorPhaseII = () =>
  api.get('/approvals/innovation-coordinator-phase-ii');

export const approvePhaseI = ({ submissionId, status, comments }) =>
  api.post('/approvals/approve-phase-i', {
    submissionId,
    status,
    comments,
    role: 'INNOVATION_COORDINATOR',
  });

export const approvePhaseII = ({ submissionId, status, comments }) =>
  api.post('/approvals/approve-phase-ii', {
    submissionId,
    status,
    comments,
    role: 'INNOVATION_COORDINATOR',
  });

// Faculty list (Innovation Coordinators)
export const fetchCoordinators = () => api.get('/faculty', { params: { role: 'INNOVATION_COORDINATOR' } });

export default {
  fetchClassAdvisorStats,
  fetchClassAdvisorSubmissions,
  submitClassAdvisorApproval,
  fetchInnovationCoordinatorStats,
  fetchInnovationCoordinatorPhaseI,
  fetchInnovationCoordinatorPhaseII,
  approvePhaseI,
  approvePhaseII,
  fetchCoordinators,
};

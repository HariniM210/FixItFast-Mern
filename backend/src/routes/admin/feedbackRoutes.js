const express = require('express');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const { getAllFeedbacks, downloadFeedbackReport } = require('../../controllers/adminFeedbackController');

const router = express.Router();

// All routes require admin auth
router.use(authenticateToken, requireAdmin);

// GET /api/admin/feedbacks
router.get('/', getAllFeedbacks);

// GET /api/admin/feedbacks/report
router.get('/report', downloadFeedbackReport);

module.exports = router;
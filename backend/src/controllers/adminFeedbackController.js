const ExcelJS = require('exceljs');
const Feedback = require('../models/Feedback');
const Admin = require('../models/Admin');

// Helper to compose a human-friendly feedback message
const buildMessage = (fb) => {
  const parts = [];
  if (fb.feedback?.likedMost) parts.push(`Liked: ${fb.feedback.likedMost}`);
  if (fb.feedback?.improvement) parts.push(`Improve: ${fb.feedback.improvement}`);
  if (fb.feedback?.suggestion) parts.push(`Suggestion: ${fb.feedback.suggestion}`);
  if (parts.length === 0) {
    const ratings = [
      fb.feedback?.satisfaction && `Satisfaction: ${fb.feedback.satisfaction}`,
      fb.feedback?.resolutionMet && `Resolution: ${fb.feedback.resolutionMet}`,
      fb.feedback?.timeliness && `Timeliness: ${fb.feedback.timeliness}`,
      fb.feedback?.communication && `Communication: ${fb.feedback.communication}`,
      fb.feedback?.updates && `Updates: ${fb.feedback.updates}`,
      fb.feedback?.easeOfUse && `Ease of use: ${fb.feedback.easeOfUse}`,
      fb.feedback?.recommendation && `Recommend: ${fb.feedback.recommendation}`,
    ].filter(Boolean);
    return ratings.join(' | ');
  }
  return parts.join(' | ');
};

// GET /api/admin/feedbacks
const getAllFeedbacks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Determine scope by admin role/city
    const admin = await Admin.findById(req.user.id).select('role city');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const filter = {};
    if (String(admin.role).toLowerCase() !== 'superadmin') {
      const city = (admin.city || '').trim();
      if (!city) return res.status(400).json({ success: false, message: 'Admin city not set' });
      filter.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(filter)
    ]);

    const data = items.map((fb) => ({
      id: fb._id,
      username: fb.user?.name || 'Unknown',
      email: fb.user?.email || 'N/A',
      city: fb.city || '',
      message: buildMessage(fb),
      createdAt: fb.createdAt,
    }));

    res.json({ success: true, feedbacks: data, pagination: { page, limit, total } });
  } catch (err) {
    console.error('getAllFeedbacks error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch feedbacks' });
  }
};

// GET /api/admin/feedbacks/report
const downloadFeedbackReport = async (req, res) => {
  try {
    // Determine scope by admin role/city
    const admin = await Admin.findById(req.user.id).select('role city');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const filter = {};
    if (String(admin.role).toLowerCase() !== 'superadmin') {
      const city = (admin.city || '').trim();
      if (!city) return res.status(400).json({ success: false, message: 'Admin city not set' });
      filter.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    const items = await Feedback.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Feedback Report');

    sheet.columns = [
      { header: 'Username', key: 'username', width: 26 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'Feedback', key: 'message', width: 80 },
      { header: 'Date Submitted', key: 'date', width: 24 },
    ];

    // Header style
    sheet.getRow(1).font = { bold: true };

    items.forEach((fb) => {
      sheet.addRow({
        username: fb.user?.name || 'Unknown',
        email: fb.user?.email || 'N/A',
        city: fb.city || '',
        message: buildMessage(fb),
        date: new Date(fb.createdAt).toLocaleString(),
      });
    });

    // Auto filter and styling
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    };
    sheet.eachRow((row, idx) => {
      row.alignment = { vertical: 'middle', wrapText: true };
      if (idx === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEFF4FF' },
        };
      }
    });

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const filename = `Feedback_Report_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('downloadFeedbackReport error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

module.exports = { getAllFeedbacks, downloadFeedbackReport };
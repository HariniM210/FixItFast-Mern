const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Dashboard = require('../models/Dashboard');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /me
 * Get dashboard statistics for the logged-in user
 * Protected route - requires JWT authentication
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Dashboard stats request for user:', req.user.id);
    
    const userId = req.user.id;
    
    // Get or create dashboard for user
    let dashboard = await Dashboard.findOne({ user: userId });
    if (!dashboard) {
      // Create dashboard if it doesn't exist
      dashboard = await Dashboard.create({ user: userId });
    }
    
    // Get additional stats for enhanced dashboard
    const categoryStats = await Complaint.aggregate([
      {
        $match: { user: new require('mongoose').Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const priorityStats = await Complaint.aggregate([
      {
        $match: { user: new require('mongoose').Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const recentComplaints = await Complaint.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description status category priority location createdAt');
    
    const user = await User.findById(userId).select('name email location');
    
    // Prepare response data matching the required format
    const dashboardData = {
      user: dashboard.user.toString(),
      totalComplaints: dashboard.totalComplaints,
      pending: dashboard.pending,
      inProgress: dashboard.inProgress,
      resolved: dashboard.resolved,
      rejected: dashboard.rejected,
      // Additional data for enhanced dashboard
      userInfo: {
        name: user.name,
        email: user.email,
        location: user.location
      },
      categoryBreakdown: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      priorityBreakdown: priorityStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentComplaints: recentComplaints
    };
    
    console.log(`✅ Dashboard stats retrieved for user ${userId}:`);
    console.log(`   - Total: ${dashboardData.totalComplaints}`);
    console.log(`   - Pending: ${dashboardData.pending}`);
    console.log(`   - In Progress: ${dashboardData.inProgress}`);
    console.log(`   - Resolved: ${dashboardData.resolved}`);
    
    return res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /simple
 * Get simple dashboard data in the exact required format
 * Protected route - requires JWT authentication
 */
router.get('/simple', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create dashboard for user
    let dashboard = await Dashboard.findOrCreateForUser(userId);
    
    // Return data in exact format requested
    const responseData = {
      user: dashboard.user.toString(),
      totalComplaints: dashboard.totalComplaints,
      pending: dashboard.pending,
      inProgress: dashboard.inProgress,
      resolved: dashboard.resolved
    };
    
    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ Simple dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /all
 * Get dashboard data for all users (admin only)
 * Protected route - requires admin authentication
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Get all dashboards
    const dashboards = await Dashboard.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    // Format response data
    const responseData = dashboards.map(dashboard => ({
      user: dashboard.user._id.toString(),
      userName: dashboard.user.name,
      userEmail: dashboard.user.email,
      totalComplaints: dashboard.totalComplaints,
      pending: dashboard.pending,
      inProgress: dashboard.inProgress,
      resolved: dashboard.resolved,
      rejected: dashboard.rejected
    }));
    
    return res.status(200).json({
      success: true,
      data: responseData,
      count: responseData.length
    });
    
  } catch (error) {
    console.error('❌ All dashboards error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch all dashboard data'
    });
  }
});


/**
 * GET /admin/stats
 * Get statistics for admin dashboard
 * - SuperAdmin: overall system statistics (no filter)
 * - Admin: city-scoped statistics (filtered by admin.city)
 */
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.actorType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }

    const role = (req.user.role || '').toLowerCase();
    const isSuperAdmin = role === 'superadmin';
    let cityFilter = {};

    if (!isSuperAdmin) {
      // Fetch admin to determine city securely from token context
      const admin = await Admin.findById(req.user.id).select('city');
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
      if (!admin.city) {
        return res.status(400).json({ success: false, message: 'Admin has no city assigned' });
      }
      cityFilter = { city: admin.city };
    }

    console.log('📥 Admin dashboard stats request', isSuperAdmin ? '(superadmin - overall)' : `(city: ${cityFilter.city})`);

    // Build aggregate pipelines with optional city match
    const statsPipeline = [];
    if (!isSuperAdmin) statsPipeline.push({ $match: cityFilter });
    statsPipeline.push({
      $group: {
        _id: null,
        totalComplaints: { $sum: 1 },
        pendingComplaints: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        assignedComplaints: { $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] } },
        inProgressComplaints: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
        resolvedComplaints: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        rejectedComplaints: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } }
      }
    });

    const categoriesPipeline = [];
    if (!isSuperAdmin) categoriesPipeline.push({ $match: cityFilter });
    categoriesPipeline.push(
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    );

    const [overallStats, topCategories] = await Promise.all([
      Complaint.aggregate(statsPipeline),
      Complaint.aggregate(categoriesPipeline)
    ]);

    // Users count is not city-scoped unless you have city on User; keep overall for now
    const [totalUsers, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' })
    ]);

    // Recent complaints (limit 10), filtered when admin
    const recentComplaints = await Complaint.find(cityFilter)
      .populate('user', 'name email location')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status category priority location city createdAt');

    const statsRow = overallStats[0] || {};
    const adminData = {
      statistics: {
        totalComplaints: statsRow.totalComplaints || 0,
        pendingComplaints: statsRow.pendingComplaints || 0,
        assignedComplaints: statsRow.assignedComplaints || 0,
        inProgressComplaints: statsRow.inProgressComplaints || 0,
        resolvedComplaints: statsRow.resolvedComplaints || 0,
        rejectedComplaints: statsRow.rejectedComplaints || 0,
        totalUsers,
        activeUsers
      },
      topCategories,
      recentComplaints
    };

    return res.status(200).json({ success: true, data: adminData });
  } catch (error) {
    console.error('❌ Admin dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

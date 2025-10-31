import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { complaintsAPI, adminAPI } from '../../../services/api';
import { COMPLAINT_STATUSES, STATUS_ORDER, STATUS_COLORS } from '../../../utils/constants';
import UserComplaintDetailsModal from '../../../components/modals/UserComplaintDetailsModal';
import axios from 'axios';
import './ManageComplaints.css';

const ManageComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [detailsOpenId, setDetailsOpenId] = useState('');

  const statusOptions = STATUS_ORDER; // ['Pending', 'Inprogress', 'Resolved']

  // Format user address/location safely (supports string or object)
  const formatUserAddress = (u) => {
    if (!u) return 'N/A';
    const loc = u.location;
    // If location is a string
    if (typeof loc === 'string') return loc || 'N/A';
    // If location is an object with known fields
    if (loc && typeof loc === 'object') {
      const parts = [loc.address, loc.city, loc.district || loc.state, loc.pincode || loc.zipcode, loc.country]
        .filter(Boolean)
        .map(String);
      if (parts.length) return parts.join(', ');
      // Try coordinates if present
      if (loc.latitude && loc.longitude) return `${loc.latitude}, ${loc.longitude}`;
    }
    // Fallback to separate fields if present on user
    const parts2 = [u.address, u.city, u.district, u.pincode, u.country].filter(Boolean).map(String);
    if (parts2.length) return parts2.join(', ');
    return 'N/A';
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Fetching complaints for admin...');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      params.limit = 1000; // Get more complaints for admin view
      
      // Try admin API first, then fallback to regular API
      let data;
      try {
        const response = await adminAPI.getAllComplaints(params);
        data = response.data;
        console.log('✅ Fetched via admin API:', data?.complaints?.length);
      } catch (adminError) {
        console.log('❌ Admin API failed, trying regular API...');
        const response = await complaintsAPI.getAll(params);
        data = response.data;
        console.log('✅ Fetched via regular API:', data?.complaints?.length);
      }
      
      const list = data?.complaints || [];
      const filtered = search
        ? list.filter((c) => c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                              c.title?.toLowerCase().includes(search.toLowerCase()) ||
                              c.description?.toLowerCase().includes(search.toLowerCase()))
        : list;
      setComplaints(filtered);
      console.log('✅ Total complaints loaded:', filtered.length);
    } catch (e) {
      console.error('❌ Failed to fetch complaints:', e);
      setError(e?.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    const id = setTimeout(fetchComplaints, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleStatusChange = async (id, newStatus, adminNote = '') => {
    if (!statusOptions.includes(newStatus)) {
      alert('Invalid status. Only Pending, Inprogress, and Resolved are allowed.');
      return;
    }
    
    setUpdatingId(id);
    try {
      console.log(`🔄 Updating complaint ${id} status to ${newStatus}`);
      
      // Use direct API call to ensure proper headers and format
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5000/api/complaints/${id}/status`, 
        { 
          status: newStatus, 
          adminNote: adminNote || `Status changed to ${newStatus} by admin` 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Status updated successfully');
      await fetchComplaints();
      
      // Show success message
      alert(`Complaint status updated to ${newStatus} successfully!`);
    } catch (e) {
      console.error('❌ Failed to update status:', e);
      const errorMsg = e?.response?.data?.message || 'Failed to update status';
      alert(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await complaintsAPI.delete(id);
      await fetchComplaints();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete complaint');
    }
  };

  return (
    <div className="manage-complaints-container">
      <div className="page-header elegant-gradient">
        <h1 className="heading-title">📄 Manage Complaints</h1>
        <p className="heading-subtitle">Admin control panel for complaint status management</p>

        {/* Status Summary (previous elegant style) */}
        {(() => {
          const pending = complaints.filter(c => c.status === COMPLAINT_STATUSES.PENDING).length;
          const inprogress = complaints.filter(c => c.status === COMPLAINT_STATUSES.IN_PROGRESS).length;
          const resolved = complaints.filter(c => c.status === COMPLAINT_STATUSES.RESOLVED).length;
          const total = Math.max(complaints.length, 1);
          const pPct = Math.round((pending / total) * 100);
          const iPct = Math.round((inprogress / total) * 100);
          const rPct = Math.round((resolved / total) * 100);
          return (
            <div className="summary-section">
              <div className="summary-header">📊 Complaint Status Overview</div>
              <div className="bar-wrapper">
                <div className="bar">
                  <div className="bar-seg pending" style={{ width: `${pPct}%` }}><span>⏳ {pending}</span></div>
                  <div className="bar-seg inprogress" style={{ width: `${iPct}%` }}><span>🔄 {inprogress}</span></div>
                  <div className="bar-seg resolved" style={{ width: `${rPct}%` }}><span>✅ {resolved}</span></div>
                </div>
                <div className="total-card">
                  <div className="total-num">{complaints.length}</div>
                  <div className="total-label">Total Complaints</div>
                </div>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="dot dot-p"></div>
                  <div>Pending</div>
                  <div className="muted">({pending})</div>
                  <div className="muted">{pPct.toFixed(0)}%</div>
                </div>
                <div className="summary-item">
                  <div className="dot dot-i"></div>
                  <div>Inprogress</div>
                  <div className="muted">({inprogress})</div>
                  <div className="muted">{iPct.toFixed(0)}%</div>
                </div>
                <div className="summary-item">
                  <div className="dot dot-r"></div>
                  <div>Resolved</div>
                  <div className="muted">({resolved})</div>
                  <div className="muted">{rPct.toFixed(0)}%</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by user name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <option value="">All Categories</option>
          <option value="Roads">Roads</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Water">Water</option>
          <option value="Electricity">Electricity</option>
          <option value="Other">Other</option>
        </select>
        <button onClick={fetchComplaints} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f7fafc' }}>Refresh</button>
      </div>

      {error && <div style={{ color: '#c53030', marginBottom: '0.5rem' }}>{error}</div>}

      <div className="table-wrap">
        <table className="complaints-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>User Information</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: '12px' }}>🔄 Loading complaints...</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: '12px' }}>📝 No complaints found</td></tr>
            ) : (
              complaints.map((c) => {
                const statusColors = STATUS_COLORS;
                const priorityColors = {
                  'Low': '#10b981',
                  'Medium': '#f59e0b',
                  'High': '#ef4444',
                  'Critical': '#dc2626'
                };
                return (
                  <tr key={c._id} className={`card-row ${updatingId === c._id ? 'updating' : ''}`}>
                    <td className="id-col">{c._id.substring(c._id.length - 6)}</td>
                    <td className="title-col">
                      <div className="title-text">{c.title || 'Untitled'}</div>
                      {c.description && (
                        <div className="title-desc">{c.description}</div>
                      )}
                    </td>
                    <td className="user-col">
                      <div 
                        className="user-info-clickable"
                        role="button"
                        title="View user & complaint details"
                        onClick={() => setDetailsOpenId(c._id)}
                        style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '4px 8px', alignItems: 'center' }}
                      >
                        <div style={{ fontSize: 12, color: '#6b7280' }}>ID</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.user?._id || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Name</div>
                        <div>{c.user?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Email</div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.user?.email || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Phone</div>
                        <div>{c.user?.phone || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Address</div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatUserAddress(c.user)}</div>
                      </div>
                    </td>
                    <td className="cat-col"><span className="cat-badge">{c.category}</span></td>
                    <td className="pri-col"><span className="pri-badge" style={{ background: priorityColors[c.priority] || '#6b7280' }}>{c.priority || 'Medium'}</span></td>
                    <td className="desc-col">{c.description}</td>
                    <td className="date-col">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="status-col">
                      <select 
                        value={c.status} 
                        disabled={updatingId === c._id} 
                        onChange={(e) => handleStatusChange(c._id, e.target.value)} 
                        className="status-select"
                        style={{ backgroundColor: statusColors[c.status] }}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {updatingId === c._id && <span style={{ marginLeft: '8px' }}>🔄</span>}
                    </td>
                    <td className="actions-col">
                      <div className="action-btns">
                        <button onClick={() => setDetailsOpenId(c._id)} className="btn view">👁️</button>
                        <button onClick={() => { const note = prompt('Add admin note (optional):'); if (note !== null) handleStatusChange(c._id, c.status, note); }} className="btn note">📝</button>
                        <button onClick={() => handleDelete(c._id)} className="btn del">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User/Complaint Details Modal */}
      <UserComplaintDetailsModal
        complaintId={detailsOpenId}
        open={!!detailsOpenId}
        onClose={() => setDetailsOpenId('')}
      />
    </div>
  );
};

// Simple inline SVG line chart component (no external deps)
const LineMiniChart = ({ data }) => {
  const labels = ['Pending', 'In Progress', 'Resolved'];
  const values = [data.pending || 0, data.inprogress || 0, data.resolved || 0];
  const max = Math.max(1, ...values);
  const points = values.map((v, i) => {
    const x = 40 + i * 120; // spacing
    const y = 150 - (v / max) * 120; // chart height 120px with bottom padding
    return `${x},${y}`;
  }).join(' ');
  const gridY = [0.25, 0.5, 0.75, 1].map(r => 150 - r * 120);
  return (
    <svg width="420" height="170" viewBox="0 0 420 170" style={{ display: 'block' }}>
      {/* Axes */}
      <line x1="30" y1="150" x2="400" y2="150" stroke="#e5e7eb" />
      <line x1="30" y1="30" x2="30" y2="150" stroke="#e5e7eb" />
      {/* Grid lines */}
      {gridY.map((gy, idx) => (
        <line key={idx} x1="30" y1={gy} x2="400" y2={gy} stroke="#f1f5f9" />
      ))}
      {/* Data line */}
      <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points} />
      {/* Points */}
      {values.map((v, i) => {
        const x = 40 + i * 120;
        const y = 150 - (v / max) * 120;
        return <circle key={i} cx={x} cy={y} r="4" fill="#2563eb" stroke="#1d4ed8" />
      })}
      {/* Labels */}
      {labels.map((l, i) => (
        <text key={l} x={40 + i * 120} y={165} textAnchor="middle" style={{ fontSize: 11, fill: '#6b7280' }}>{l}</text>
      ))}
    </svg>
  );
};

export default ManageComplaints;

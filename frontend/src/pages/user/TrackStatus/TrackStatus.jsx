import React, { useState, useEffect, useMemo } from 'react';
import { useComplaint } from '../../../context/ComplaintContext';
import './TrackStatus.css';

const TrackStatus = () => {
  const { complaints, loading, refreshComplaints } = useComplaint();
  
  // Listen for admin status updates
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      console.log('📋 TrackStatus: Status updated, refreshing...', event.detail);
      refreshComplaints();
    };
    
    window.addEventListener('complaintStatusUpdated', handleStatusUpdate);
    
    return () => {
      window.removeEventListener('complaintStatusUpdated', handleStatusUpdate);
    };
  }, [refreshComplaints]);
  const [animateCards, setAnimateCards] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    // Trigger staggered animation after component mounts
    const t = setTimeout(() => setAnimateCards(true), 100);

    // Polling for real-time updates every 20s
    const interval = setInterval(() => {
      try { refreshComplaints?.(); } catch (_) {}
    }, 20000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [refreshComplaints]);

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase().replace(' ', '-')) {
      case 'pending': return '⏳';
      case 'in-progress': return '🔄';
      case 'assigned': return '📋';
      case 'resolved': return '✅';
      default: return '📋';
    }
  };

  const fmt = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  };

  const getWorkStatus = (c) => {
    const s = String(c?.status || '').toLowerCase();
    if (s === 'resolved' || s === 'completed') return 'Completed';
    if (s === 'in progress' || s === 'inprogress') return 'In Progress';
    if (s === 'assigned') return 'Assigned';
    return c?.assignedTo ? 'Assigned' : 'Pending';
  };

  const extractLabour = (c) => {
    const assigned = c?.assignedLabour || c?.assigned_to || c?.labour || c?.assignedTo || null;
    const obj = typeof assigned === 'object' && assigned !== null ? assigned : {};
    return {
      id: obj._id || obj.id || (typeof assigned === 'string' ? assigned : null) || '—',
      name: obj.name || obj.fullName || '—',
      phone: obj.phone || obj.contact || obj.mobile || '—',
      assignedAt: c?.assignedAt || c?.assignmentDate || c?.assignment_time || null,
      status: getWorkStatus(c),
    };
  };

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getId = (c) => c?._id || c?.id || 'unknown';

  // Compute last updated based on statusHistory last updatedAt, fallback to updatedAt, then createdAt
  const withDerived = useMemo(() => {
    return (Array.isArray(complaints) ? complaints : []).map((c) => {
      const history = Array.isArray(c?.statusHistory) ? c.statusHistory : [];
      const lastHist = history.length ? history[history.length - 1] : null;
      const lastUpdated = lastHist?.updatedAt || c?.updatedAt || c?.createdAt || null;
      const isResolved = String(c?.status).toLowerCase() === 'resolved';
      return { ...c, _derived: { lastUpdated, isResolved } };
    });
  }, [complaints]);

  // Sort: Resolved first, then by lastUpdated desc
  const sorted = useMemo(() => {
    return withDerived.slice().sort((a, b) => {
      const ra = a._derived.isResolved ? 1 : 0;
      const rb = b._derived.isResolved ? 1 : 0;
      if (rb !== ra) return rb - ra; // resolved first
      const ta = new Date(a._derived.lastUpdated || 0).getTime();
      const tb = new Date(b._derived.lastUpdated || 0).getTime();
      return tb - ta; // newest lastUpdated first
    });
  }, [withDerived]);

  const getRandomDelay = (index) => `${index * 0.15}s`;

  if (loading) {
    return (
      <div className="trackstatus-page theme-page-bg">
        <div className="loading-container theme-card">
          <div className="loading-spinner"></div>
          <p className="loading-text theme-text-primary">✨ Loading your complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trackstatus-page theme-page-bg">
      <div className="page-header">
        <div className="header-decoration">
          <span className="decoration-dot"></span>
          <span className="decoration-dot"></span>
          <span className="decoration-dot"></span>
        </div>
        <h1 className="page-title theme-text-primary">💖 Track Your Complaints</h1>
        <p className="page-subtitle theme-text-secondary">Stay updated on the progress of your reports ✨</p>
        
        {sorted.length > 0 && (
          <div className="complaints-summary">
            <div className="summary-item theme-card">
              <span className="summary-icon">📊</span>
              <span className="summary-text theme-text-primary">Total: {sorted.length}</span>
            </div>
            <div className="summary-item theme-card">
              <span className="summary-icon">⏳</span>
              <span className="summary-text theme-text-primary">Pending: {sorted.filter(c => c.status === 'Pending').length}</span>
            </div>
            <div className="summary-item theme-card">
              <span className="summary-icon">📋</span>
              <span className="summary-text theme-text-primary">Assigned: {sorted.filter(c => c.status === 'Assigned').length}</span>
            </div>
            <div className="summary-item theme-card">
              <span className="summary-icon">✅</span>
              <span className="summary-text theme-text-primary">Resolved: {sorted.filter(c => c.status === 'Resolved').length}</span>
            </div>
          </div>
        )}
      </div>
      
      {sorted.length === 0 ? (
        <div className="empty-state theme-card">
          <div className="empty-icon">🌸</div>
          <h3 className="empty-title theme-text-primary">No Complaints Yet</h3>
          <p className="empty-subtitle theme-text-secondary">Ready to make your community better?</p>
          <div className="empty-cta">
            <span className="cta-text">Go ahead and lodge your first complaint! </span>
            <span className="cta-emoji">💪✨</span>
          </div>
        </div>
      ) : (
        <div className="complaints-list">
          {sorted.map((complaint, index) => {
            const cid = getId(complaint);
            const labour = extractLabour(complaint);
            const hasAssignment = !!complaint?.assignedTo || !!complaint?.assignedLabour || !!complaint?.labour || !!complaint?.assigned_to;
            return (
              <div key={cid}>
                <div
                  className={`complaint-card theme-card-elevated theme-hover status-${String(complaint.status).toLowerCase().replace(' ', '-')} ${animateCards ? 'animate-in' : ''}`}
                  style={{ animationDelay: getRandomDelay(index) }}
                >
                  <div className="card-glow"></div>
                  
                  <div className="card-header">
                    <div className="title-section">
                      <span className="complaint-icon">💬</span>
                      <h3 className="complaint-title theme-text-primary">{complaint.title}</h3>
                    </div>
                    <div className="status-label">{String(complaint.status || 'Assigned')}</div>
                  </div>

                  <div className="card-content">
                    <div className="description-section">
                      <span className="content-icon">📝</span>
                      <p className="complaint-description theme-text-secondary">{complaint.description}</p>
                    </div>
                    <div className="meta-section">
                      <div className="meta-row theme-text-primary"><strong>Complaint ID:</strong> {cid}</div>
                      <div className="meta-row theme-text-primary"><strong>Last Updated:</strong> {fmt(complaint._derived.lastUpdated)}</div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="footer-item location">
                      <span className="footer-icon">📍</span>
                      <span className="footer-text theme-text-secondary">{complaint.location}</span>
                    </div>
                    <div className="footer-item date">
                      <span className="footer-icon">📅️</span>
                      <span className="footer-text theme-text-secondary">{fmt(complaint.createdAt)}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button className="action-btn primary theme-btn-primary" onClick={() => refreshComplaints?.()}>
                      <span className="btn-icon">🔄</span>
                      <span>Refresh</span>
                    </button>
                    <button
                      className="action-btn secondary theme-btn-secondary"
                      onClick={() => toggleExpanded(cid)}
                      disabled={!hasAssignment}
                      aria-expanded={!!expanded[cid]}
                      aria-controls={`labour-details-${cid}`}
                      title={hasAssignment ? 'View assigned labour details' : 'No labour assigned yet'}
                    >
                      <span className="btn-icon">👷</span>
                      <span>{expanded[cid] ? 'Hide Labour Details' : 'View Labour Details'}</span>
                    </button>
                  </div>
                </div>

                {/* Assigned Labour Details (collapsible) */}
                {expanded[cid] && (
                  <div id={`labour-details-${cid}`} className="labour-details theme-card">
                    <div className="labour-details-header">
                      <h4 className="labour-title theme-text-primary">Assigned Labour Details</h4>
                      <span className={`labour-status-badge status-${getWorkStatus(complaint).toLowerCase().replace(' ', '-')}`}>
                        {getWorkStatus(complaint)}
                      </span>
                    </div>

                    {hasAssignment ? (
                      <div className="labour-grid">
                        <div className="labour-row"><strong>Name:</strong><span>{labour.name}</span></div>
                        <div className="labour-row"><strong>Labour ID:</strong><span>{labour.id}</span></div>
                        <div className="labour-row"><strong>Contact Number:</strong><span>{labour.phone}</span></div>
                        <div className="labour-row"><strong>Assigned Date / Time:</strong><span>{fmt(labour.assignedAt)}</span></div>
                        <div className="labour-row"><strong>Work Status:</strong><span>{labour.status}</span></div>
                      </div>
                    ) : (
                      <div className="labour-empty theme-text-secondary">No labour assigned yet for this complaint.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackStatus;

import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import AttachmentViewer from '../AttachmentViewer/AttachmentViewer';

const fallback = (v) => (v === undefined || v === null || v === '' ? 'Not provided' : v);

const UserComplaintDetailsModal = ({ complaintId, open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const escHandler = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [open, escHandler]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  useEffect(() => {
    if (!open || !complaintId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await adminAPI.getComplaint(complaintId);
        if (!mounted) return;
        setData(res.data?.complaint || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load complaint');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, complaintId]);

  if (!open) return null;

  const copy = (text) => {
    try { navigator.clipboard.writeText(String(text)); } catch {}
  };

  const user = data?.user || {};
  const district = data?.district || user?.district;
  const city = data?.city || user?.city;
  const pincode = data?.pincode || user?.pincode;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 6000, padding: 16, paddingTop: 72
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 96vw)', maxHeight: '80vh', 
          background: '#fff', borderRadius: 16, 
          boxShadow: '0 20px 48px rgba(2, 6, 23, 0.15), 0 0 0 1px rgba(255,255,255,0.05)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ 
          display:'flex', 
          justifyContent:'space-between', 
          alignItems:'center', 
          padding: '20px 24px', 
          borderBottom:'1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
          flexShrink: 0
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 User & Complaint Details
          </h3>
          <button 
            onClick={onClose} 
            aria-label="Close" 
            style={{ 
              width: '36px',
              height: '36px',
              border: '1px solid #e5e7eb', 
              background: '#ffffff', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#6b7280',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(2,6,23,0.04)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#d1d5db';
              e.target.style.color = '#374151';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ffffff';
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.color = '#6b7280';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ 
          padding: '24px', 
          background:'#ffffff',
          flex: 1,
          overflow: 'auto'
        }}>
          {loading && <div>Loading...</div>}
          {error && <div style={{ color:'#b91c1c' }}>{error}</div>}

          {data && (
            <>
              {/* Two-column definition layout */}
              <div style={{
                display:'grid', 
                gridTemplateColumns:'220px 1fr', 
                columnGap: '16px', 
                rowGap: '10px', 
                alignItems:'start', 
                background:'#ffffff',
                border:'1px solid #e5e7eb',
                borderRadius:12,
                padding: '16px 16px'
              }}>
                <div style={{ fontWeight:600, color:'#334155' }}>Full Name</div>
                <div style={{ color:'#0f172a' }}>{fallback(user.name)}</div>

                <div style={{ fontWeight:600, color:'#334155' }}>Full ID</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <code style={{ fontFamily:'monospace', background:'#f1f5f9', padding:'2px 6px', borderRadius:6 }}>{fallback(user._id)}</code>
                  {user._id && <button onClick={() => copy(user._id)} title="Copy User ID" style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, padding:'2px 6px', cursor:'pointer' }}>Copy</button>}
                </div>

                <div style={{ fontWeight:600, color:'#334155' }}>Email</div>
                <div>{fallback(user.email)}</div>

                <div style={{ fontWeight:600, color:'#334155' }}>Contact</div>
                <div>{fallback(user.phone)}</div>

                <div style={{ fontWeight:600, color:'#334155' }}>District</div>
                <div>{fallback(district)}</div>

                <div style={{ fontWeight:600, color:'#334155' }}>City</div>
                <div>{fallback(city)}</div>

                <div style={{ fontWeight:600, color:'#334155' }}>Pincode</div>
                <div>{fallback(pincode)}</div>

                <div style={{ fontWeight:600, color:'#334155' }}>Date / Time</div>
                <div>{new Date(data.createdAt).toLocaleString()}</div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight:600, marginBottom: 8, color:'#334155' }}>Complaint Description</div>
                <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, padding:14, whiteSpace:'pre-wrap' }}>
                  {fallback(data.description)}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight:600, marginBottom: 8, color:'#334155' }}>Uploaded Image(s)</div>
                {data.attachments && data.attachments.length > 0 ? (
                  <AttachmentViewer attachments={data.attachments} compact={false} />
                ) : (
                  <div style={{ color:'#6b7280' }}>Not provided</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserComplaintDetailsModal;
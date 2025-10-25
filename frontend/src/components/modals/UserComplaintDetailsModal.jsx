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
        zIndex: 1000, padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 96vw)', maxHeight: '92vh', overflow: 'auto',
          background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: 16, borderBottom:'1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0 }}>User & Complaint Details</h3>
          <button onClick={onClose} aria-label="Close" style={{ border:'1px solid #e5e7eb', background:'#f9fafb', borderRadius:8, padding:'6px 10px', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 16 }}>
          {loading && <div>Loading...</div>}
          {error && <div style={{ color:'#b91c1c' }}>{error}</div>}

          {data && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight:600 }}>Full Name</div>
                  <div>{fallback(user.name)}</div>
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>Full ID</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <code style={{ fontFamily:'monospace' }}>{fallback(user._id)}</code>
                    {user._id && <button onClick={() => copy(user._id)} title="Copy User ID">📋</button>}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>Email</div>
                  <div>{fallback(user.email)}</div>
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>Contact</div>
                  <div>{fallback(user.phone)}</div>
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>District</div>
                  <div>{fallback(district)}</div>
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>City</div>
                  <div>{fallback(city)}</div>
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>Pincode</div>
                  <div>{fallback(pincode)}</div>
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>Date / Time</div>
                  <div>{new Date(data.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight:600, marginBottom: 6 }}>Complaint Description</div>
                <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:12, whiteSpace:'pre-wrap' }}>
                  {fallback(data.description)}
                </div>
              </div>

              <div>
                <div style={{ fontWeight:600, marginBottom: 6 }}>Uploaded Image(s)</div>
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
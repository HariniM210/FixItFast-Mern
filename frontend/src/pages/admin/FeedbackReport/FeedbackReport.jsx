import React, { useEffect, useMemo, useState } from 'react';
import { API } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const prettyDate = (d) => new Date(d).toLocaleString();

const FeedbackCard = ({ item, delay = 0 }) => (
  <div className="fr-item" style={{ animationDelay: `${delay}ms` }}>
    <div className="fr-avatar">🗣️</div>
    <div className="fr-content">
      <div className="fr-row">
        <span className="fr-name">{item.username}</span>
        <span className="fr-email">{item.email}</span>
        <span className="fr-city">{item.city || '—'}</span>
        <span className="fr-date">{prettyDate(item.createdAt)}</span>
      </div>
      <div className="fr-message">{item.message || '—'}</div>
    </div>
  </div>
);

const Toast = ({ text, onClose }) => (
  <div className="fr-toast" role="status" aria-live="polite" onAnimationEnd={() => setTimeout(onClose, 1200)}>
    ✅ {text}
  </div>
);

const FeedbackReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const navigate = useNavigate();

  const fetchAll = async (p = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/admin/feedbacks', { params: { page: p, limit } });
      if (res.data?.success) {
        setData(res.data.feedbacks || []);
        setTotal(res.data.pagination?.total || 0);
        setPage(p);
      } else {
        throw new Error(res.data?.message || 'Failed to load feedback');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/feedbacks/report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      const dt = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const fname = `Feedback_Report_${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}_${pad(dt.getHours())}-${pad(dt.getMinutes())}.xlsx`;
      a.href = url;
      a.download = fname;
      a.click();
      window.URL.revokeObjectURL(url);
      setToast('Feedback report downloaded successfully.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(1); }, []);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  return (
    <div className="fr-wrap">
      <style>{`
        .fr-wrap{min-height:100vh;padding:2rem;background:linear-gradient(135deg,#eef2ff 0%,#f8fafc 100%);} 
        .fr-card{max-width:1200px;margin:0 auto;background:#fff;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,.12);overflow:hidden}
        .fr-head{display:flex;gap:.75rem;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#1e3a8a 0%,#4338ca 100%);color:#fff}
        .fr-title{font-size:1.25rem;font-weight:800;letter-spacing:.2px;display:flex;gap:.6rem;align-items:center}
        .fr-sub{opacity:.9;font-size:.9rem}
        .fr-actions{display:flex;gap:.5rem;align-items:center}
        .fr-btn{border:none;border-radius:12px;padding:.6rem 1rem;font-weight:700;cursor:pointer;transition:transform .15s ease,filter .15s ease}
        .fr-btn:disabled{opacity:.6;cursor:not-allowed}
        .fr-btn.primary{background:#10b981;color:#fff}
        .fr-btn.secondary{background:#0ea5e9;color:#fff}
        .fr-btn:hover{transform:translateY(-1px);filter:brightness(1.05)}
        .fr-body{padding:1rem 1.5rem}
        .fr-list{display:flex;flex-direction:column;gap:.75rem}
        .fr-item{display:flex;gap:.9rem;padding:1rem;border:1px solid #e5e7eb;border-radius:14px;background:#fff;align-items:flex-start; animation: fr-pop .35s ease both}
        .fr-avatar{width:44px;height:44px;border-radius:12px;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-size:1.2rem}
        .fr-content{flex:1;min-width:0}
.fr-row{display:grid;grid-template-columns:1fr auto auto auto;gap:.75rem;align-items:center;margin-bottom:.35rem}
        .fr-name{font-weight:800;color:#111827}
        .fr-email{color:#374151;background:#f3f4f6;border-radius:8px;padding:.2rem .5rem;font-size:.85rem}
        .fr-city{color:#3730a3;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:.2rem .5rem;font-size:.85rem}
        .fr-date{color:#6b7280;font-size:.85rem}
        .fr-message{color:#111827;line-height:1.5;white-space:pre-wrap}
        .fr-foot{display:flex;gap:.5rem;justify-content:flex-end;padding:1rem 1.5rem;border-top:1px solid #e5e7eb}
        .fr-pager{display:flex;gap:.4rem;align-items:center}
        .fr-chip{font-size:.85rem;background:#eef2ff;border:1px solid #c7d2fe;padding:.2rem .6rem;border-radius:9999px;color:#3730a3}
        .fr-empty{padding:2rem;text-align:center;color:#6b7280}
        .fr-err{padding:.8rem 1rem;border-radius:10px;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;margin:1rem 1.5rem}
        .fr-skel{height:86px;border-radius:14px;background:linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6);background-size:200% 100%;animation:fr-shimmer 1.2s infinite}
        .fr-toast{position:fixed;right:18px;bottom:18px;background:#16a34a;color:#fff;padding:.7rem 1rem;border-radius:12px;box-shadow:0 10px 20px rgba(0,0,0,.18);animation:fr-fade 2.2s ease-in-out}
        @keyframes fr-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fr-pop{0%{opacity:0;transform:translateY(6px) scale(.98)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes fr-fade{0%{opacity:0;transform:translateY(10px)}10%{opacity:1;transform:translateY(0)}90%{opacity:1}100%{opacity:0;transform:translateY(10px)}}
        @media (max-width:800px){.fr-row{grid-template-columns:1fr}.fr-email,.fr-date{justify-self:start}}
      `}</style>

      <div className="fr-card">
        <div className="fr-head">
          <div>
            <div className="fr-title">📥 Feedback Report</div>
            <div className="fr-sub">View user feedback and export to Excel</div>
          </div>
          <div className="fr-actions">
            <button className="fr-btn secondary" onClick={() => navigate('/admin/dashboard')}>Back</button>
            <button className="fr-btn primary" onClick={download} disabled={loading}>Generate Excel Report</button>
          </div>
        </div>

        {error && <div className="fr-err">{error}</div>}

        <div className="fr-body">
          {loading && (
            <div className="fr-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="fr-skel" />
              ))}
            </div>
          )}
          {!loading && data.length === 0 && (
            <div className="fr-empty">No feedback found.</div>
          )}
          {!loading && data.length > 0 && (
            <div className="fr-list">
              {data.map((it, idx) => (
                <FeedbackCard key={it.id} item={it} delay={idx * 35} />
              ))}
            </div>
          )}
        </div>

        <div className="fr-foot">
          <div className="fr-pager">
            <button className="fr-btn" onClick={() => fetchAll(Math.max(1, page - 1))} disabled={page === 1 || loading}>Prev</button>
            <span className="fr-chip">Page {page} / {pages}</span>
            <button className="fr-btn" onClick={() => fetchAll(Math.min(pages, page + 1))} disabled={page >= pages || loading}>Next</button>
          </div>
        </div>
      </div>

      {toast && <Toast text={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default FeedbackReport;
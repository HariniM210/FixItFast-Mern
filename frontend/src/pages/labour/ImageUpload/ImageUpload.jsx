import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API, { apiHelpers, complaintsAPI } from '../../../services/api';
import './ImageUpload.css';

const ImageUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [complaint, setComplaint] = useState(null);
  const [images, setImages] = useState({ before: [], after: [] });

  const [beforeQueue, setBeforeQueue] = useState([]); // [{ file, preview, progress, done }]
  const [afterQueue, setAfterQueue] = useState([]);

  const [statusNote, setStatusNote] = useState('');

  const hasBefore = useMemo(() => (images.before?.length || 0) + beforeQueue.filter(f=>f.done).length > 0, [images.before, beforeQueue]);
  const hasAfter = useMemo(() => (images.after?.length || 0) + afterQueue.filter(f=>f.done).length > 0, [images.after, afterQueue]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Complaint details (labour-scoped)
      const res = await fetch(`${API.defaults.baseURL.replace(/\/$/, '')}/labour/complaints/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (!res.ok) throw new Error('Failed to load complaint');
      const data = await res.json();
      setComplaint(data?.complaint || null);

      // Progress images (grouped)
      try {
        const pi = await complaintsAPI.getProgressImages(id);
        setImages(pi.data?.images || { before: [], after: [] });
      } catch (_) {
        setImages({ before: [], after: [] });
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Cleanup previews on unmount
    return () => {
      beforeQueue.forEach(i => i.preview && URL.revokeObjectURL(i.preview));
      afterQueue.forEach(i => i.preview && URL.revokeObjectURL(i.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onPick = (type, files) => {
    const list = Array.from(files || []).map(f => ({ file: f, preview: URL.createObjectURL(f), progress: 0, done: false }));
    if (type === 'before') setBeforeQueue(prev => [...prev, ...list]);
    else setAfterQueue(prev => [...prev, ...list]);
  };

  const removeFromQueue = (type, idx) => {
    if (type === 'before') {
      const copy = [...beforeQueue];
      const [removed] = copy.splice(idx, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      setBeforeQueue(copy);
    } else {
      const copy = [...afterQueue];
      const [removed] = copy.splice(idx, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      setAfterQueue(copy);
    }
  };

  const uploadOne = async (file, imageType, setProgress) => {
    const form = new FormData();
    form.append('image_type', imageType);
    form.append('images', file);
    const url = `/labour/complaints/${id}/progress-images`;
    await API.post(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!evt.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        setProgress(pct);
      }
    });
  };

  const autoUpdateStatus = async (note = '') => {
    try {
      // Decide status based on uploaded sets
      const beforeNow = (images.before?.length || 0) + beforeQueue.filter(f=>f.done).length > 0;
      const afterNow = (images.after?.length || 0) + afterQueue.filter(f=>f.done).length > 0;
      if (beforeNow && !afterNow) {
        await API.put(`/labour/complaints/${id}/status`, { status: 'In Progress', remarks: note || 'Auto update after before images upload' });
      } else if (beforeNow && afterNow) {
        await API.put(`/labour/complaints/${id}/status`, { status: 'Resolved', remarks: note || 'Auto update after before & after images upload' });
      }
    } catch (_) {
      // Non-blocking
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      // Upload before files sequentially for per-file progress
      for (let i = 0; i < beforeQueue.length; i++) {
        if (beforeQueue[i].done) continue;
        // eslint-disable-next-line no-loop-func
        await uploadOne(beforeQueue[i].file, 'before', (p)=>{
          setBeforeQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: p } : it));
        });
        setBeforeQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: 100, done: true } : it));
      }

      // Upload after files
      for (let i = 0; i < afterQueue.length; i++) {
        if (afterQueue[i].done) continue;
        // eslint-disable-next-line no-loop-func
        await uploadOne(afterQueue[i].file, 'after', (p)=>{
          setAfterQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: p } : it));
        });
        setAfterQueue(prev => prev.map((it, idx) => idx === i ? { ...it, progress: 100, done: true } : it));
      }

      await autoUpdateStatus(statusNote);
      // Refresh list
      const pi = await complaintsAPI.getProgressImages(id);
      setImages(pi.data?.images || { before: [], after: [] });
    } catch (e) {
      setError(apiHelpers.handleError(e).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return (
    <div className="iu-container">
      <div className="iu-alert iu-error">{error}</div>
      <div style={{ marginTop: 12 }}>
        <button className="iu-btn" onClick={load}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="iu-container">
      <div className="iu-header">
        <div>
          <h1>Image Upload</h1>
          <p>Upload before and after images for the assigned complaint.</p>
        </div>
        <div className="iu-actions">
          <Link to={`/labour/assigned-complaints`} className="iu-btn iu-secondary">← Back</Link>
        </div>
      </div>

      {complaint && (
        <div className="iu-complaint">
          <div className="iu-row">
            <div><b>Complaint ID:</b> <span title={complaint._id}>CPL-{String(complaint._id).slice(-8)}</span></div>
            <div><b>Title:</b> {complaint.title}</div>
          </div>
          <div className="iu-row">
            <div><b>Location:</b> {complaint.location || '-'}</div>
            <div><b>Status:</b> {complaint.status}</div>
          </div>
          <div className="iu-desc">{complaint.description || '-'}</div>
        </div>
      )}

      <div className="iu-sections">
        <div className="iu-section">
          <div className="iu-section-header iu-before">Before Images</div>
          <div className="iu-thumbs">
            {images.before?.map((img, idx) => (
              <div className="iu-thumb" key={`b-ex-${idx}`}>
                <img src={img.imageUrl} alt="before" />
                <div className="iu-thumb-cap">Uploaded</div>
              </div>
            ))}
            {beforeQueue.map((it, idx) => (
              <div className="iu-thumb" key={`b-q-${idx}`}>
                <img src={it.preview} alt="before-q" />
                <div className="iu-progress"><div style={{ width: `${it.progress}%` }} /></div>
                <div className="iu-thumb-actions">
                  {!it.done ? (
                    <button className="iu-mini" onClick={() => removeFromQueue('before', idx)}>Delete</button>
                  ) : (
                    <span className="iu-done">✅</span>
                  )}
                </div>
              </div>
            ))}
            {(!images.before || images.before.length === 0) && beforeQueue.length === 0 && (
              <div className="iu-empty">No images yet</div>
            )}
          </div>
          <div className="iu-picker">
            <input id="pick-before" type="file" accept="image/*" multiple onChange={(e)=> onPick('before', e.target.files)} />
            <label htmlFor="pick-before" className="iu-btn">Upload Image</label>
          </div>
        </div>

        <div className="iu-section">
          <div className="iu-section-header iu-after">After Images</div>
          <div className="iu-thumbs">
            {images.after?.map((img, idx) => (
              <div className="iu-thumb" key={`a-ex-${idx}`}>
                <img src={img.imageUrl} alt="after" />
                <div className="iu-thumb-cap">Uploaded</div>
              </div>
            ))}
            {afterQueue.map((it, idx) => (
              <div className="iu-thumb" key={`a-q-${idx}`}>
                <img src={it.preview} alt="after-q" />
                <div className="iu-progress"><div style={{ width: `${it.progress}%` }} /></div>
                <div className="iu-thumb-actions">
                  {!it.done ? (
                    <button className="iu-mini" onClick={() => removeFromQueue('after', idx)}>Delete</button>
                  ) : (
                    <span className="iu-done">✅</span>
                  )}
                </div>
              </div>
            ))}
            {(!images.after || images.after.length === 0) && afterQueue.length === 0 && (
              <div className="iu-empty">No images yet</div>
            )}
          </div>
          <div className="iu-picker">
            <input id="pick-after" type="file" accept="image/*" multiple onChange={(e)=> onPick('after', e.target.files)} />
            <label htmlFor="pick-after" className="iu-btn">Upload Image</label>
          </div>
        </div>
      </div>

      <div className="iu-footer">
        <input 
          className="iu-note" 
          placeholder="Optional: add a remark for status update" 
          value={statusNote} 
          onChange={(e)=>setStatusNote(e.target.value)} 
        />
        <button className="iu-btn iu-primary" disabled={saving || (beforeQueue.length === 0 && afterQueue.length === 0)} onClick={handleSubmit}>
          {saving ? 'Saving...' : 'Submit / Save'}
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;
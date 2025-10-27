import React, { useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, isEmailJsConfigured } from './config/emailjs';

const TestEmailJS = () => {
  const [status, setStatus] = useState(null); // null | 'ok' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('=== EmailJS Environment Test ===');
    console.log('Config:', EMAILJS_CONFIG);
    console.log('Configured:', isEmailJsConfigured);
    console.log('=== End Test ===');
    if (isEmailJsConfigured) {
      emailjs.init(EMAILJS_CONFIG.publicKey);
    }
  }, []);

  const sendTest = async () => {
    if (!isEmailJsConfigured) {
      setStatus('error');
      setMessage('EmailJS is not configured. Add VITE_EMAILJS_* vars to .env.local.');
      return;
    }
    try {
      const res = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          user_name: 'FixItFast Test',
          user_email: 'test@example.com',
          message: 'This is a test message from the TestEmailJS component.',
          timestamp: new Date().toLocaleString(),
          subject: 'EmailJS Test'
        }
      );
      setStatus('ok');
      setMessage(`Email sent. Status: ${res.status}`);
    } catch (e) {
      setStatus('error');
      setMessage(e?.text || e?.message || 'Failed to send');
    }
  };

  return (
    <div style={{margin: '1rem 0', padding: '0.75rem', border: '1px dashed #ddd', borderRadius: 8}}>
      <strong>EmailJS quick test</strong>
      <div style={{marginTop: 8}}>
        <button type="button" onClick={sendTest} style={{padding: '6px 10px', borderRadius: 6}}>
          Send test email
        </button>
      </div>
      {status && (
        <div style={{marginTop: 8, color: status === 'ok' ? 'green' : 'crimson'}}>{message}</div>
      )}
    </div>
  );
};

export default TestEmailJS;

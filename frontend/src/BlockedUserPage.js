import React, { useState, useEffect } from 'react';

const BlockedUserPage = ({ blockInfo, onLogout }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimeRemaining = () => {
      if (!blockInfo?.blockExpiresAt) return;

      const now = new Date().getTime();
      const blockExpires = new Date(blockInfo.blockExpiresAt).getTime();
      const difference = blockExpires - now;

      if (difference <= 0) {
        setTimeRemaining('Block has expired. Please refresh the page.');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) timeString += `${days}d `;
      if (hours > 0) timeString += `${hours}h `;
      if (minutes > 0) timeString += `${minutes}m `;
      timeString += `${seconds}s`;

      setTimeRemaining(timeString);
    };

    // Update immediately
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [blockInfo]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    onLogout();
  };

  return (
    <div className="blocked-container">
      <div className="blocked-card">
        <div className="blocked-header">
          <div className="blocked-icon">🚫</div>
          <h1 className="blocked-title">Account Temporarily Blocked</h1>
        </div>

        <div className="blocked-content">
          <div className="block-info">
            <p className="block-message">
              Your account has been temporarily blocked due to community guideline violations.
            </p>
            
            <div className="violation-details">
              <div className="violation-count">
                <span className="violation-label">Violations:</span>
                <span className="violation-number">{blockInfo?.violationCount || 0}/2</span>
              </div>
            </div>

            <div className="time-remaining">
              <div className="time-label">Time Remaining:</div>
              <div className="time-display">
                <div className="time-value">{timeRemaining}</div>
              </div>
            </div>
          </div>

          <div className="guidelines-section">
            <h3>Community Guidelines Reminder</h3>
            <div className="guidelines-list">
              <div className="guideline-item">
                <span className="guideline-icon">✅</span>
                <span>Provide content related to software testing and applications</span>
              </div>
              <div className="guideline-item">
                <span className="guideline-icon">✅</span>
                <span>Use appropriate language and professional descriptions</span>
              </div>
              <div className="guideline-item">
                <span className="guideline-icon">✅</span>
                <span>Focus on legitimate testing requirements and scenarios</span>
              </div>
              <div className="guideline-item">
                <span className="guideline-icon">❌</span>
                <span>Avoid harmful, inappropriate, or non-software related content</span>
              </div>
            </div>
          </div>

          <div className="blocked-actions">
            <button className="btn btn-secondary" onClick={handleLogout}>
              🔐 Logout
            </button>
          </div>
        </div>
      </div>

      <div className="background-decoration">
        <div className="decoration-circle decoration-1"></div>
        <div className="decoration-circle decoration-2"></div>
        <div className="decoration-circle decoration-3"></div>
      </div>
    </div>
  );
};

export default BlockedUserPage;

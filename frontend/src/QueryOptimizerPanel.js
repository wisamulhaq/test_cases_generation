import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QueryOptimizerPanel = ({ isOpen, onClose, authToken, showNotification }) => {
  const [formData, setFormData] = useState({
    background: '',
    requirements: '',
    additionalInformation: ''
  });
  
  const [optimizedData, setOptimizedData] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [copyNotification, setCopyNotification] = useState({ show: false, message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const optimizeQuery = async () => {
    if (!formData.background.trim() || !formData.requirements.trim()) {
      setError('Background and requirements are required');
      return;
    }

    setIsOptimizing(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/optimize-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.details || errorData.error || 'Failed to optimize query');
      }

      const result = await response.json();
      setOptimizedData(result.data);
    } catch (error) {
      console.error('Error optimizing query:', error);
      
      let errorMessage = 'Failed to optimize query';
      if (error.message.includes('Language Not Supported') || error.message.includes('not in English')) {
        errorMessage = '🌍 Language Error: Please provide your input in English for optimization.';
      } else if (error.message.includes('Content Safety Violation') || error.message.includes('harmful or inappropriate')) {
        errorMessage = '⚠️ Content Safety Alert: Your input contains inappropriate content. Please revise and try again.';
      } else if (error.message.includes('Invalid Request Scope') || error.message.includes('do not align with the application context')) {
        errorMessage = '❌ Invalid Request: Please ensure your input relates to software test case generation.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyNotification({ show: true, message: '✅ Copied to clipboard!' });
      setTimeout(() => {
        setCopyNotification({ show: false, message: '' });
      }, 2000); // Short 2-second notification for copy actions
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
      setCopyNotification({ show: true, message: '❌ Copy failed' });
      setTimeout(() => {
        setCopyNotification({ show: false, message: '' });
      }, 2000);
    });
  };

  const clearForm = () => {
    setFormData({
      background: '',
      requirements: '',
      additionalInformation: ''
    });
    setOptimizedData(null);
    setError('');
  };

  return (
    <>
      {/* Subtle overlay when sidebar is open */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      ></div>
      
      <div className={`query-optimizer-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="sidebar-icon">🤖</span>
          <h3>Query Optimizer</h3>
        </div>
        <button className="close-sidebar-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="sidebar-content">
        {/* Copy Notification */}
        {copyNotification.show && (
          <div className="copy-notification">
            {copyNotification.message}
          </div>
        )}
        
        <div className="sidebar-description">
          <p>Enhance your test case generation inputs with AI-powered optimization for better results.</p>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        <div className="input-section">
          <div className="form-group">
            <label className="form-label">
              💼 Application Background
            </label>
            <textarea
              name="background"
              className="form-textarea"
              placeholder="Describe your application, its purpose, and main functionality..."
              value={formData.background}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              📝 Requirements
            </label>
            <textarea
              name="requirements"
              className="form-textarea"
              placeholder="Enter your requirements, features, or user stories..."
              value={formData.requirements}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              ⚙️ Additional Information (Optional)
            </label>
            <textarea
              name="additionalInformation"
              className="form-textarea"
              placeholder="Any additional context or specifications..."
              value={formData.additionalInformation}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <div className="sidebar-actions">
            <button
              className="btn btn-secondary btn-small"
              onClick={clearForm}
              disabled={isOptimizing}
            >
              🗑️ Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={optimizeQuery}
              disabled={isOptimizing || !formData.background.trim() || !formData.requirements.trim()}
            >
              {isOptimizing ? (
                <>
                  <span className="loading-spinner"></span>
                  Optimizing...
                </>
              ) : (
                '✨ Optimize'
              )}
            </button>
          </div>
        </div>

        {optimizedData && (
          <div className="output-section">
            <h4 className="output-title">🎯 Optimized Results</h4>
            
            <div className="optimized-field">
              <div className="field-header">
                <label className="field-label">💼 Enhanced Background</label>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(optimizedData.enhancedBackground)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <div className="field-content">
                {optimizedData.enhancedBackground}
              </div>
            </div>

            <div className="optimized-field">
              <div className="field-header">
                <label className="field-label">📝 Enhanced Requirements</label>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(optimizedData.enhancedRequirements)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <div className="field-content">
                {optimizedData.enhancedRequirements}
              </div>
            </div>

            {optimizedData.enhancedAdditionalInformation && (
              <div className="optimized-field">
                <div className="field-header">
                  <label className="field-label">⚙️ Enhanced Additional Information</label>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(optimizedData.enhancedAdditionalInformation)}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
                <div className="field-content">
                  {optimizedData.enhancedAdditionalInformation}
                </div>
              </div>
            )}

            <div className="usage-note">
              <p>💡 <strong>Tip:</strong> Use the copy buttons to copy optimized text and paste it into your main form for better test case generation.</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default QueryOptimizerPanel;

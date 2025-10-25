import  { useState, useEffect } from 'react';

const LoginPage = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: '203148057775-p7us8cim7gio95jkf6vj8jmeivvij3to.apps.googleusercontent.com', // TODO: Replace with your actual client ID
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the sign-in button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '320',
          text: 'signin_with',
          shape: 'rectangular',
        }
      );
    };

    return () => {
      // Cleanup script
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = async (response) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: response.credential,
        }),
      });

      const data = await result.json();

      if (!result.ok) {
        if (data.type === 'USER_BLOCKED') {
          setError(data.details);
          return;
        }
        throw new Error(data.details || 'Authentication failed');
      }

      // Store token and user info
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.user));

      // Call parent component's success handler
      onLoginSuccess(data.user, data.token);

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
            <h1 className="app-title">Avicenna.AI</h1>
            <p className="app-subtitle">AI-Powered Test Case Generation Platform</p>
          </div>
        </div>

        <div className="login-content">
          <div className="welcome-text">
            <h2>Welcome Back</h2>
            <p>Sign in to continue generating intelligent test cases for your software projects</p>
          </div>

          <div className="login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="google-signin-container">
              <div id="google-signin-button"></div>
              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <span>Signing you in...</span>
                </div>
              )}
            </div>

            <div className="login-footer">
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">✨</span>
                  <span>AI-Powered Test Generation</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🖼️</span>
                  <span>Image-Based Test Cases</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔄</span>
                  <span>Human Feedback Integration</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Export & Integration Ready</span>
                </div>
              </div>
            </div>
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

export default LoginPage;

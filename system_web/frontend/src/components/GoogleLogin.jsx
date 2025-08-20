import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginComponent = ({ onSuccess, onError }) => {
  const handleSuccess = (credentialResponse) => {
    console.log('Google login success:', credentialResponse);
    
    // Send the credential to your Django backend
    fetch('http://localhost:8000/api/auth/google/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: JSON.stringify({
        credential: credentialResponse.credential,
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        onSuccess(data.user);
      } else {
        onError(data.error || 'Login failed');
      }
    })
    .catch(error => {
      console.error('Login error:', error);
      onError('Network error during login');
    });
  };

  const handleError = () => {
    console.log('Google login failed');
    onError('Google login failed');
  };

  // Helper function to get CSRF token
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  return (
    <div className="google-login-container">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
      />
    </div>
  );
};

export default GoogleLoginComponent;


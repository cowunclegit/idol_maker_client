import React from 'react';

const GoogleSignInButton = ({ user }) => {
  return (
    <div id="google-sign-in-button" style={{ display: user ? 'none' : 'block' }}></div>
  );
};

export default GoogleSignInButton;

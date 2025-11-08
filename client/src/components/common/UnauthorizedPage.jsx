import React from 'react';
import { Link } from 'react-router-dom';
import './error.css';

const UnauthorizedPage = () => {
  return (
    <div className="error-page status-403">
      <h1>403</h1>
      <h2>Unauthorized Access</h2>
      <p>You don't have permission to access this page.</p>
      <Link to="/" className="home-link">
        Back to Home
      </Link>
    </div>
  );
};

export default UnauthorizedPage;

import React from 'react';
import { Link } from 'react-router-dom';
import './error.css';

const NotFoundPage = () => {
  return (
    <div className="error-page status-404">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="home-link">
        Go to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;

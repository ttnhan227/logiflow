import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <h1 className="welcome-message">Welcome to LogiFlow</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>Your logistics management solution</p>
    </div>
  );
};

export default HomePage;

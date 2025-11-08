import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';

const AboutPage = () => {
  return (
    <div className="home-container">
      <h1 className="welcome-message">About LogiFlow</h1>
      <p style={{ maxWidth: 900, color: '#556' }}>
        LogiFlow is a modern logistics management platform designed to streamline dispatch, fleet
        tracking, and operations for transport teams of any size. Our solution focuses on clarity,
        reliability, and performance so teams can spend less time troubleshooting and more time
        moving goods.
      </p>

      <div style={{ maxWidth: 900, textAlign: 'left', marginTop: '1rem', color: '#444' }}>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.
          Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis
          sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.
        </p>

        <p>
          Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora
          torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero.
          Sed dignissim lacinia nunc.
        </p>

        <p>
          Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas
          mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi
          lectus risus, iaculis vel, suscipit quis, luctus non, massa.
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/" className="login-button">Back to Home</Link>
      </div>
    </div>
  );
};

export default AboutPage;

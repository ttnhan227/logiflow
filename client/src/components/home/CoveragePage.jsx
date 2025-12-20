import React from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './home.css';

// Custom marker icons
const createIcon = (color) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}"/>
      <circle cx="12" cy="9" r="3" fill="white"/>
    </svg>
  `)}`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

// HQ marker icon
const hqIcon = new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L28 12V28H20V18H12V28H4V12L16 2Z" fill="#DC2626"/>
      <circle cx="16" cy="12" r="4" fill="white"/>
      <text x="16" y="17" text-anchor="middle" fill="#DC2626" font-size="8" font-weight="bold">HQ</text>
    </svg>
  `)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const northIcon = createIcon('#3b82f6');
const centralIcon = createIcon('#10b981');
const southIcon = createIcon('#f59e0b');

const CoveragePage = () => {
  // Major cities with approximate coordinates
  const cities = [
    // Northern Region - Blue markers
    { name: 'Hanoi', coords: [21.0278, 105.8342], region: 'north' },
    { name: 'Hai Phong', coords: [20.8460, 106.6881], region: 'north' },
    { name: 'Quang Ninh', coords: [20.9718, 107.0417], region: 'north' },
    { name: 'Nam Dinh', coords: [20.4200, 106.1683], region: 'north' },

    // Central Region - Green markers
    { name: 'Da Nang', coords: [16.0544, 108.2022], region: 'central' },
    { name: 'Hue', coords: [16.4619, 107.5950], region: 'central' },
    { name: 'Nha Trang', coords: [12.2388, 109.1967], region: 'central' },
    { name: 'Quang Ngai', coords: [15.1214, 108.8044], region: 'central' },

    // Southern Region - Orange markers
    { name: 'Ho Chi Minh City', coords: [10.8231, 106.6297], region: 'south' },
    { name: 'Can Tho', coords: [10.0458, 105.7469], region: 'south' },
    { name: 'Vung Tau', coords: [10.4044, 107.1369], region: 'south' },
    { name: 'Nha Be', coords: [10.6620, 106.7358], region: 'south' }
  ];

  // Headquarters location
  const headquarters = {
    name: 'LogiFlow Headquarters',
    address: '123 Nguyen Trai Street, District 1',
    city: 'Ho Chi Minh City',
    phone: '+84 1900-1234',
    email: 'business@logiflow.vn',
    coords: [10.7757, 106.7009] // District 1, HCMC coordinates
  };

  return (
    <div className="home-container">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          color: 'var(--text-color)',
          marginBottom: '1rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, var(--primary-color), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Service Coverage
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          color: '#556',
          marginBottom: '3rem'
        }}>
          Nationwide delivery coverage across Vietnam's major cities and provinces.
        </p>

        {/* Vietnam Interactive Map */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '4rem',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', textAlign: 'center' }}>Vietnam Coverage Map</h2>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem' }}>
            Click city markers to see delivery information • From northern border to southern tip of Vietnam
          </p>

          <div style={{
            height: '400px',
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <MapContainer
              center={[14.0583, 108.2772]} // Center of Vietnam
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Headquarters Marker */}
              <Marker
                position={headquarters.coords}
                icon={hqIcon}
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <strong style={{ color: '#DC2626', fontSize: '1.1rem' }}>
                      🏢 {headquarters.name}
                    </strong><br/>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {headquarters.address}<br/>
                      {headquarters.city}, Vietnam<br/>
                      📞 {headquarters.phone}<br/>
                      ✉️ {headquarters.email}
                    </span><br/>
                    <span style={{ color: '#DC2626', fontWeight: 'bold' }}>
                      Headquarters & Operations Center
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* City Markers */}
              {cities.map((city) => (
                <Marker
                  key={city.name}
                  position={city.coords}
                  icon={city.region === 'north' ? northIcon :
                        city.region === 'central' ? centralIcon : southIcon}
                >
                  <Popup>
                    <div style={{ textAlign: 'center' }}>
                      <strong>{city.name}</strong><br/>
                      <span style={{
                        color: city.region === 'north' ? '#3b82f6' :
                               city.region === 'central' ? '#10b981' : '#f59e0b'
                      }}>
                        {city.region.charAt(0).toUpperCase() + city.region.slice(1)} Region
                      </span><br/>
                      🚚 Active delivery service<br/>
                      📦 Same/next-day available
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundImage: `url("data:image/svg+xml;base64,${btoa(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L28 12V28H20V18H12V28H4V12L16 2Z" fill="#DC2626"/>
                    <circle cx="16" cy="12" r="3" fill="white"/>
                    <text x="16" y="16" text-anchor="middle" fill="#DC2626" font-size="6" font-weight="bold">HQ</text>
                  </svg>
                `)}`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat'
              }}></div>
              <span>LogiFlow HQ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>
              <span>Northern Cities</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
              <span>Central Cities</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></div>
              <span>Southern Cities</span>
            </div>
          </div>
        </div>

        {/* Regional Coverage */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem', color: 'var(--text-color)' }}>
            Regional Coverage
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem'
          }}>
            {/* Northern Region */}
            <div style={{
              padding: '2rem',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '2.5rem', marginRight: '1rem' }}>🌆</div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.5rem' }}>
                    Northern Vietnam
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Red River Delta Region</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Major Cities:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Hanoi', 'Hai Phong', 'Quang Ninh', 'Bac Ninh', 'Hung Yen', 'Hai Duong', 'Nam Dinh', 'Thanh Hoa'].map(city => (
                    <span key={city} style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                  50+ drivers active
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Same-day delivery available
                </div>
              </div>
            </div>

            {/* Central Region */}
            <div style={{
              padding: '2rem',
              border: '2px solid #10b981',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '2.5rem', marginRight: '1rem' }}>🏖️</div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.5rem' }}>
                    Central Vietnam
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Coastal and Highlands Region</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Major Cities:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Da Nang', 'Hue', 'Nha Trang', 'Quang Nam', 'Binh Dinh', 'Khanh Hoa', 'Quang Ngai'].map(city => (
                    <span key={city} style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent)' }}>
                  30+ drivers active
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  2-5 day delivery available
                </div>
              </div>
            </div>

            {/* Southern Region */}
            <div style={{
              padding: '2rem',
              border: '2px solid #f59e0b',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '2.5rem', marginRight: '1rem' }}>🌴</div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.5rem' }}>
                    Southern Vietnam
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Mekong Delta and Southeast Region</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Major Cities:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Ho Chi Minh City', 'Can Tho', 'Vung Tau', 'Bien Hoa', 'Nha Be', 'Thu Dau Mot'].map(city => (
                    <span key={city} style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f59e0b' }}>
                  70+ drivers active
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Express delivery available
                </div>
              </div>
            </div>

            {/* Inter-Province Service */}
            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '2.5rem', marginRight: '1rem' }}>🚗</div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.5rem' }}>
                    Nationwide Network
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Cross-province delivery solutions</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Service Coverage:</h4>
                <p style={{ color: '#666', margin: 0, lineHeight: '1.6' }}>
                  Reliable transportation between all major cities and provinces,
                  including smaller towns and industrial zones.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                  63 provinces covered
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Dedicated routes available
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem', color: 'var(--text-color)' }}>
            Coverage Details
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Express Service</h3>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
                Same-day delivery in major cities and provincial capitals.
                Perfect for urgent documents and time-sensitive packages.
              </p>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                Available in 15+ cities
              </div>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Standard Service</h3>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
                Reliable 2-3 day delivery service across all regions.
                Ideal for standard shipping requirements and cost-effective solutions.
              </p>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                Full nationwide coverage
              </div>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏪</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Business Districts</h3>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
                Dedicated service for industrial zones, business parks,
                and high-traffic commercial areas with specialized logistics.
              </p>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                200+ industrial zones served
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{
          background: 'var(--primary-color)',
          color: 'white',
          padding: '3rem 1rem',
          borderRadius: '12px',
          marginBottom: '4rem',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Coverage Statistics</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>63</div>
              <div>Provinces & Cities</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>200+</div>
              <div>Toones of Routes</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>150+</div>
              <div>Active Drivers</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>99%</div>
              <div>Coverage Reliability</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div style={{
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Ready to Ship Nationwide?</h2>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            Experience reliable delivery across Vietnam with our extensive network.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/track" style={{
              padding: '1rem 2rem',
              background: 'var(--primary-color)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Track Your Package
            </Link>
            <Link to="/contact" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoveragePage;

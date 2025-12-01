import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { routeService } from '../../services';
import './admin.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for origin and destination
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
const MapClickHandler = ({ onMapClick, selectingMode }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectingMode) {
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', onMapClick);
    } else {
      map.getContainer().style.cursor = '';
      map.off('click', onMapClick);
    }
    
    return () => {
      map.off('click', onMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, onMapClick, selectingMode]);
  
  return null;
};

const AdminRoutesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [routePaths, setRoutePaths] = useState({}); // Store actual road paths for each route
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'create', 'edit'
  const [previewPath, setPreviewPath] = useState(null); // Store preview path for create/edit modal
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [selectingPoint, setSelectingPoint] = useState(null); // 'origin' or 'destination'
  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [formData, setFormData] = useState({
    routeName: '',
    originAddress: '',
    originLat: '',
    originLng: '',
    destinationAddress: '',
    destinationLat: '',
    destinationLng: '',
    distanceKm: '',
    estimatedDurationHours: '',
    routeType: 'standard'
  });

  // Vietnam boundaries (approximate)
  const VIETNAM_BOUNDS = {
    minLat: 8.5,
    maxLat: 23.4,
    minLng: 102.1,
    maxLng: 109.5
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, routesData] = await Promise.all([
        routeService.getRouteStatistics(),
        routeService.getAllRoutes()
      ]);
      setStatistics(statsData);
      setRoutes(routesData);
      setLoading(false);
      
      // Fetch actual road paths in background (non-blocking)
      fetchRoutePaths(routesData);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load routes data');
      setLoading(false);
    }
  };

  const fetchRoutePaths = async (routesData) => {
    // Fetch paths in background without blocking UI
    for (const route of routesData) {
      try {
        const path = await getOSRMRoute(
          route.originLng,
          route.originLat,
          route.destinationLng,
          route.destinationLat
        );
        if (path) {
          setRoutePaths(prev => ({
            ...prev,
            [route.routeId]: path
          }));
        }
      } catch (err) {
        console.error(`Failed to fetch path for route ${route.routeId}:`, err);
        // Continue with next route even if this one fails
      }
    }
  };

  const getOSRMRoute = async (originLng, originLat, destLng, destLat) => {
    try {
      // Add intermediate waypoints for long-distance routes to keep them within Vietnam
      const waypoints = getVietnameseWaypoints(originLat, originLng, destLat, destLng);
      
      // Build coordinates string with waypoints
      const coordsString = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for longer routes
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates;
        // Convert from [lng, lat] to [lat, lng] for Leaflet
        return coordinates.map(coord => [coord[1], coord[0]]);
      }
      return null;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('OSRM request timed out');
      } else {
        console.error('OSRM routing error:', err);
      }
      return null;
    }
  };

  const getVietnameseWaypoints = (originLat, originLng, destLat, destLng) => {
    const waypoints = [{ lat: originLat, lng: originLng }];
    
    // Calculate distance to determine if we need intermediate waypoints
    const distance = Math.sqrt(
      Math.pow(destLat - originLat, 2) + Math.pow(destLng - originLng, 2)
    );
    
    // For long routes (> 5 degrees, roughly > 550km), add waypoints along Vietnam's coast/Route 1
    if (distance > 5) {
      // Major cities along Vietnam's length (Highway 1 route)
      const vnWaypoints = [
        { name: 'Thanh Hoa', lat: 19.8067, lng: 105.7851 },
        { name: 'Vinh', lat: 18.6793, lng: 105.6811 },
        { name: 'Dong Hoi', lat: 17.4833, lng: 106.6000 },
        { name: 'Hue', lat: 16.4637, lng: 107.5909 },
        { name: 'Da Nang', lat: 16.0544, lng: 108.2022 },
        { name: 'Quang Ngai', lat: 15.1214, lng: 108.8044 },
        { name: 'Quy Nhon', lat: 13.7829, lng: 109.2196 },
        { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
        { name: 'Phan Thiet', lat: 10.9280, lng: 108.1020 },
      ];
      
      // Add waypoints that are between origin and destination
      const minLat = Math.min(originLat, destLat);
      const maxLat = Math.max(originLat, destLat);
      
      vnWaypoints.forEach(wp => {
        if (wp.lat > minLat && wp.lat < maxLat) {
          waypoints.push({ lat: wp.lat, lng: wp.lng });
        }
      });
      
      // Sort waypoints by latitude
      waypoints.sort((a, b) => {
        return originLat > destLat ? b.lat - a.lat : a.lat - b.lat;
      });
    }
    
    waypoints.push({ lat: destLat, lng: destLng });
    return waypoints;
  };

  const validateVietnamCoordinates = (lat, lng) => {
    return lat >= VIETNAM_BOUNDS.minLat && 
           lat <= VIETNAM_BOUNDS.maxLat && 
           lng >= VIETNAM_BOUNDS.minLng && 
           lng <= VIETNAM_BOUNDS.maxLng;
  };

  const handleCreate = () => {
    setModalMode('create');
    setPreviewPath(null);
    setOriginMarker(null);
    setDestinationMarker(null);
    setSelectingPoint(null);
    setFormData({
      routeName: '',
      originAddress: '',
      originLat: '',
      originLng: '',
      destinationAddress: '',
      destinationLat: '',
      destinationLng: '',
      distanceKm: '',
      estimatedDurationHours: '',
      routeType: 'standard'
    });
    setShowModal(true);
  };

  const handleEdit = (route) => {
    setModalMode('edit');
    setSelectedRoute(route);
    setOriginMarker({ lat: route.originLat, lng: route.originLng });
    setDestinationMarker({ lat: route.destinationLat, lng: route.destinationLng });
    setSelectingPoint(null);
    setFormData({
      routeName: route.routeName,
      originAddress: route.originAddress,
      originLat: route.originLat,
      originLng: route.originLng,
      destinationAddress: route.destinationAddress,
      destinationLat: route.destinationLat,
      destinationLng: route.destinationLng,
      distanceKm: route.distanceKm,
      estimatedDurationHours: route.estimatedDurationHours,
      routeType: route.routeType
    });
    setShowModal(true);
  };

  const handleView = (route) => {
    setModalMode('view');
    setSelectedRoute(route);
    setShowModal(true);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) {
      return;
    }

    try {
      await routeService.deleteRoute(routeId);
      await loadData();
      alert('Route deleted successfully');
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to delete route');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate coordinates are within Vietnam
    const originLat = parseFloat(formData.originLat);
    const originLng = parseFloat(formData.originLng);
    const destLat = parseFloat(formData.destinationLat);
    const destLng = parseFloat(formData.destinationLng);
    
    if (!validateVietnamCoordinates(originLat, originLng)) {
      alert('Origin coordinates are outside Vietnam boundaries. Please enter coordinates within Vietnam (Lat: 8.5-23.4, Lng: 102.1-109.5).');
      return;
    }
    
    if (!validateVietnamCoordinates(destLat, destLng)) {
      alert('Destination coordinates are outside Vietnam boundaries. Please enter coordinates within Vietnam (Lat: 8.5-23.4, Lng: 102.1-109.5).');
      return;
    }
    
    try {
      if (modalMode === 'create') {
        await routeService.createRoute(formData);
        alert('Route created successfully');
      } else if (modalMode === 'edit') {
        await routeService.updateRoute(selectedRoute.routeId, formData);
        alert('Route updated successfully');
      }
      
      setShowModal(false);
      await loadData();
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to save route');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle map click to select origin or destination
  const handleMapClick = async (e) => {
    if (!selectingPoint) return;
    
    const { lat, lng } = e.latlng;
    
    // Validate coordinates are within Vietnam
    if (!validateVietnamCoordinates(lat, lng)) {
      alert('Please select a location within Vietnam boundaries.');
      return;
    }
    
    if (selectingPoint === 'origin') {
      setOriginMarker({ lat, lng });
      setFormData(prev => ({
        ...prev,
        originLat: lat.toFixed(6),
        originLng: lng.toFixed(6)
      }));
      setSelectingPoint(null);
    } else if (selectingPoint === 'destination') {
      setDestinationMarker({ lat, lng });
      setFormData(prev => ({
        ...prev,
        destinationLat: lat.toFixed(6),
        destinationLng: lng.toFixed(6)
      }));
      setSelectingPoint(null);
    }
    
    // Auto-calculate route if both points are selected
    const newFormData = { ...formData };
    if (selectingPoint === 'origin') {
      newFormData.originLat = lat.toFixed(6);
      newFormData.originLng = lng.toFixed(6);
    } else {
      newFormData.destinationLat = lat.toFixed(6);
      newFormData.destinationLng = lng.toFixed(6);
    }
    
    const { originLat, originLng, destinationLat, destinationLng } = newFormData;
    if (originLat && originLng && destinationLat && destinationLng) {
      await calculateRouteFromCoordinates(
        parseFloat(originLat),
        parseFloat(originLng),
        parseFloat(destinationLat),
        parseFloat(destinationLng)
      );
    }
  };

  // Extract route calculation logic
  const calculateRouteFromCoordinates = async (oLat, oLng, dLat, dLng) => {
    if (!validateVietnamCoordinates(oLat, oLng) || !validateVietnamCoordinates(dLat, dLng)) {
      return;
    }
    
    setCalculatingRoute(true);
    try {
      const path = await getOSRMRoute(oLng, oLat, dLng, dLat);
      if (path) {
        setPreviewPath(path);
        
        // Calculate distance from path
        const distanceKm = calculatePathDistance(path);
        const durationHours = (distanceKm / 60).toFixed(2); // Assume 60 km/h average
        
        setFormData(prev => ({
          ...prev,
          distanceKm: distanceKm.toFixed(2),
          estimatedDurationHours: durationHours
        }));
      }
    } catch (err) {
      console.error('Failed to calculate route:', err);
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Auto-calculate route when coordinates change
  const handleCoordinateChange = async (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Check if we have all 4 coordinates
    const { originLat, originLng, destinationLat, destinationLng } = updatedFormData;
    if (originLat && originLng && destinationLat && destinationLng) {
      const oLat = parseFloat(originLat);
      const oLng = parseFloat(originLng);
      const dLat = parseFloat(destinationLat);
      const dLng = parseFloat(destinationLng);

      // Validate all coordinates
      if (!isNaN(oLat) && !isNaN(oLng) && !isNaN(dLat) && !isNaN(dLng) &&
          validateVietnamCoordinates(oLat, oLng) && validateVietnamCoordinates(dLat, dLng)) {
        
        setCalculatingRoute(true);
        try {
          const path = await getOSRMRoute(oLng, oLat, dLng, dLat);
          if (path) {
            setPreviewPath(path);
            
            // Calculate distance from path
            const distanceKm = calculatePathDistance(path);
            const durationHours = (distanceKm / 60).toFixed(2); // Assume 60 km/h average
            
            setFormData(prev => ({
              ...prev,
              distanceKm: distanceKm.toFixed(2),
              estimatedDurationHours: durationHours
            }));
          }
        } catch (err) {
          console.error('Failed to calculate route:', err);
        } finally {
          setCalculatingRoute(false);
        }
      }
    }
  };

  const calculatePathDistance = (path) => {
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [lat1, lng1] = path[i];
      const [lat2, lng2] = path[i + 1];
      distance += getDistanceBetweenPoints(lat1, lng1, lat2, lng2);
    }
    return distance;
  };

  const getDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getRouteTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'express': return '#f59e0b';
      case 'economy': return '#3b82f6';
      case 'standard': return '#10b981';
      default: return '#6366f1';
    }
  };

  const getRouteTypeLabel = (type) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-header">🗺️ Routes Management</h1>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading routes data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-header">🗺️ Routes Management</h1>
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  // Prepare chart data
  const routeTypeData = routes.reduce((acc, route) => {
    const type = route.routeType || 'standard';
    const existing = acc.find(item => item.type === type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ type, count: 1 });
    }
    return acc;
  }, []);

  // Route utilization data - shows how many trips each route has
  const routeUtilizationData = routes
    .sort((a, b) => (b.totalTrips || 0) - (a.totalTrips || 0))
    .slice(0, 10) // Top 10 most used routes
    .map((route, index) => ({
      name: `Route ${index + 1}`,
      fullName: route.routeName,
      trips: route.totalTrips || 0,
      active: route.activeTrips || 0
    }));

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">🗺️ Routes Management</h1>

      {/* Analytics Charts Section */}
      <div className="dashboard-section">
        <h2 className="section-title">📊 Route Analytics</h2>
        <div className="two-chart-layout">
          {/* Route Types Distribution */}
          <div className="chart-card">
            <h3 className="section-subtitle">Routes by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={routeTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                >
                  {routeTypeData.map((entry, index) => {
                    const colors = { 
                      intracity: '#3b82f6',    // Blue
                      intercity: '#10b981',     // Green
                      long_haul: '#f59e0b',     // Orange
                      standard: '#3b82f6', 
                      express: '#f59e0b', 
                      economy: '#10b981' 
                    };
                    const normalizedType = entry.type?.toLowerCase() || 'standard';
                    return <Cell key={`cell-${index}`} fill={colors[normalizedType] || '#6366f1'} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: '#6b7280' }}>
              <strong>{statistics?.totalRoutes || 0}</strong> total routes configured
            </div>
          </div>

          {/* Route Utilization - Top Routes */}
          <div className="chart-card">
            <h3 className="section-subtitle">Route Utilization - Top 10 Routes</h3>
            {routeUtilizationData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={routeUtilizationData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barSize={60}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      tick={false}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 13, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                      label={{ 
                        value: 'Number of Trips', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fontSize: 14, fill: '#6b7280', fontWeight: 600 }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{
                              backgroundColor: 'white',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                                {payload[0].payload.fullName}
                              </p>
                              {payload.map((entry, index) => (
                                <p key={index} style={{ margin: '4px 0', fontSize: '13px', color: entry.color }}>
                                  <strong>{entry.name}:</strong> {entry.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>{value}</span>}
                    />
                    <Bar 
                      dataKey="trips" 
                      name="Total Trips" 
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]}
                      label={{ 
                        position: 'top', 
                        fontSize: 12, 
                        fontWeight: 600,
                        fill: '#374151'
                      }}
                    />
                    <Bar 
                      dataKey="active" 
                      name="Active Trips" 
                      fill="#f59e0b" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontSize: '14px' }}>No route utilization data available</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Routes Map Section */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title">🗺️ Routes Map</h2>
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: '#e0f2fe', 
            borderRadius: '8px', 
            border: '1px solid #7dd3fc',
            fontSize: '13px',
            color: '#0369a1',
            fontWeight: '500'
          }}>
            ℹ️ Routes automatically follow Vietnam's road network using OSRM routing
          </div>
        </div>
        <div style={{ height: '450px', width: '100%', marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <MapContainer center={[21.0285, 105.8542]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routes.map((route) => {
              const originPos = [parseFloat(route.originLat), parseFloat(route.originLng)];
              const destPos = [parseFloat(route.destinationLat), parseFloat(route.destinationLng)];
              const routeColor = getRouteTypeColor(route.routeType);
              const actualPath = routePaths[route.routeId];
              
              return (
                <React.Fragment key={route.routeId}>
                  {/* Origin Marker */}
                  <Marker position={originPos}>
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ fontSize: '14px', color: routeColor }}>🚩 {route.routeName}</strong><br />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Origin</span><br />
                        <span style={{ fontSize: '12px', color: '#666' }}>{route.originAddress}</span>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Destination Marker */}
                  <Marker position={destPos}>
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ fontSize: '14px', color: routeColor }}>🏁 {route.routeName}</strong><br />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Destination</span><br />
                        <span style={{ fontSize: '12px', color: '#666' }}>{route.destinationAddress}</span>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Route Line - Use actual road path if available, otherwise straight line */}
                  <Polyline 
                    positions={actualPath || [originPos, destPos]} 
                    color={routeColor}
                    weight={3}
                    opacity={0.7}
                  />
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Routes Table Section */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title">📋 All Routes ({routes.length})</h2>
          <button 
            className="btn btn-primary"
            onClick={handleCreate}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '18px' }}>➕</span> Create New Route
          </button>
        </div>
        
        {/* Route Optimization Info Banner */}
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#f0fdf4', 
          borderRadius: '8px', 
          border: '1px solid #86efac',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>🚀</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
              Route Optimization Available
            </div>
            <div style={{ fontSize: '13px', color: '#15803d' }}>
              The system includes automatic route optimization for multi-stop deliveries using OSRM Trip service. 
              Routes are optimized for shortest distance and travel time, with support for Vietnam's road network.
            </div>
          </div>
        </div>
        
        {routes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗺️</div>
            <div className="empty-state-title">No Routes Found</div>
            <div className="empty-state-description">
              Create your first route to start managing deliveries.
            </div>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Route Name</th>
                  <th>Type</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Distance (km)</th>
                  <th>Duration (hrs)</th>
                  <th>Total Trips</th>
                  <th>Active Trips</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.routeId}>
                    <td style={{ fontWeight: '600' }}>{route.routeName}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: `${getRouteTypeColor(route.routeType)}20`,
                        color: getRouteTypeColor(route.routeType)
                      }}>
                        {getRouteTypeLabel(route.routeType)}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{route.originAddress}</td>
                    <td style={{ fontSize: '13px' }}>{route.destinationAddress}</td>
                    <td>{route.distanceKm}</td>
                    <td>{route.estimatedDurationHours}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: '#e5e7eb',
                        color: '#374151'
                      }}>
                        {route.totalTrips || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: route.activeTrips > 0 ? '#ffebcc' : '#e5e7eb',
                        color: route.activeTrips > 0 ? '#a36200' : '#6b7280'
                      }}>
                        {route.activeTrips || 0}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleView(route)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => handleEdit(route)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(route.routeId)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                {modalMode === 'view' ? '👁️ View Route' : modalMode === 'create' ? '➕ Create Route' : '✏️ Edit Route'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                ✕
              </button>
            </div>

            {modalMode === 'view' && selectedRoute ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <strong>Route Name:</strong> {selectedRoute.routeName}
                </div>
                <div>
                  <strong>Type:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: `${getRouteTypeColor(selectedRoute.routeType)}20`,
                    color: getRouteTypeColor(selectedRoute.routeType)
                  }}>
                    {getRouteTypeLabel(selectedRoute.routeType)}
                  </span>
                </div>
                <div>
                  <strong>Origin:</strong> {selectedRoute.originAddress}<br />
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    Coordinates: {selectedRoute.originLat}, {selectedRoute.originLng}
                  </span>
                </div>
                <div>
                  <strong>Destination:</strong> {selectedRoute.destinationAddress}<br />
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    Coordinates: {selectedRoute.destinationLat}, {selectedRoute.destinationLng}
                  </span>
                </div>
                <div>
                  <strong>Distance:</strong> {selectedRoute.distanceKm} km
                </div>
                <div>
                  <strong>Estimated Duration:</strong> {selectedRoute.estimatedDurationHours} hours
                </div>
                <div>
                  <strong>Total Trips:</strong> {selectedRoute.totalTrips || 0}
                </div>
                <div>
                  <strong>Active Trips:</strong> {selectedRoute.activeTrips || 0}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                    Route Name *
                  </label>
                  <input
                    type="text"
                    name="routeName"
                    value={formData.routeName}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                    Route Type *
                  </label>
                  <select
                    name="routeType"
                    value={formData.routeType}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="economy">Economy</option>
                  </select>
                </div>

                {/* Interactive Map for Point Selection */}
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    📍 Select Points on Map
                  </label>
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f0f9ff', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{ fontSize: '13px', color: '#0369a1', marginBottom: '8px' }}>
                      Click the buttons below, then click on the map to select origin (🟢) and destination (🔴) points.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectingPoint('origin')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: selectingPoint === 'origin' ? '#10b981' : 'white',
                          color: selectingPoint === 'origin' ? 'white' : '#10b981',
                          border: `2px solid #10b981`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                      >
                        {selectingPoint === 'origin' ? '🎯 Click Map for Origin' : '🟢 Select Origin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectingPoint('destination')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: selectingPoint === 'destination' ? '#ef4444' : 'white',
                          color: selectingPoint === 'destination' ? 'white' : '#ef4444',
                          border: `2px solid #ef4444`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                      >
                        {selectingPoint === 'destination' ? '🎯 Click Map for Destination' : '🔴 Select Destination'}
                      </button>
                    </div>
                  </div>

                  <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                    <MapContainer 
                      center={[15.8, 107.0]} 
                      zoom={6} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      <MapClickHandler 
                        onMapClick={handleMapClick} 
                        selectingMode={selectingPoint !== null}
                      />
                      
                      {originMarker && (
                        <Marker 
                          position={[originMarker.lat, originMarker.lng]} 
                          icon={originIcon}
                        >
                          <Popup>
                            <strong>🟢 Origin</strong><br />
                            {originMarker.lat.toFixed(6)}, {originMarker.lng.toFixed(6)}
                          </Popup>
                        </Marker>
                      )}
                      
                      {destinationMarker && (
                        <Marker 
                          position={[destinationMarker.lat, destinationMarker.lng]} 
                          icon={destinationIcon}
                        >
                          <Popup>
                            <strong>🔴 Destination</strong><br />
                            {destinationMarker.lat.toFixed(6)}, {destinationMarker.lng.toFixed(6)}
                          </Popup>
                        </Marker>
                      )}
                      
                      {previewPath && (
                        <Polyline 
                          positions={previewPath} 
                          color="#3b82f6" 
                          weight={4}
                          opacity={0.8}
                        />
                      )}
                    </MapContainer>
                  </div>

                  {calculatingRoute && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#fef3c7', 
                      borderRadius: '6px', 
                      marginTop: '8px',
                      fontSize: '13px',
                      color: '#92400e',
                      textAlign: 'center'
                    }}>
                      🔄 Calculating optimal route...
                    </div>
                  )}

                  {previewPath && !calculatingRoute && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f0fdf4', 
                      borderRadius: '6px', 
                      marginTop: '8px',
                      fontSize: '13px',
                      color: '#15803d',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      ✓ Route: {formData.distanceKm} km | {formData.estimatedDurationHours} hrs
                    </div>
                  )}
                </div>

                {/* Coordinate Fields (Auto-populated, can be manually adjusted) */}
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#6b7280' }}>
                    📝 Coordinates (Auto-filled from map selection)
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', opacity: 0.8 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                        Origin Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="originLat"
                        value={formData.originLat}
                        onChange={handleCoordinateChange}
                        required
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          backgroundColor: '#f9fafb'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                        Origin Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="originLng"
                        value={formData.originLng}
                        onChange={handleCoordinateChange}
                        required
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          backgroundColor: '#f9fafb'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                    Origin Address *
                  </label>
                  <input
                    type="text"
                    name="originAddress"
                    value={formData.originAddress}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Hanoi, Vietnam"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', opacity: 0.8 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                      Destination Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="destinationLat"
                      value={formData.destinationLat}
                      onChange={handleCoordinateChange}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: '#f9fafb'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                      Destination Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="destinationLng"
                      value={formData.destinationLng}
                      onChange={handleCoordinateChange}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: '#f9fafb'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                    Destination Address *
                  </label>
                  <input
                    type="text"
                    name="destinationAddress"
                    value={formData.destinationAddress}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Ho Chi Minh City, Vietnam"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                      Distance (km) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="distanceKm"
                      value={formData.distanceKm}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                      Est. Duration (hrs) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="estimatedDurationHours"
                      value={formData.estimatedDurationHours}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    {modalMode === 'create' ? 'Create Route' : 'Update Route'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutesPage;

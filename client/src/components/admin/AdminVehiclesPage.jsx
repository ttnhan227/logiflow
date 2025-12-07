import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { vehicleService } from '../../services';
import './admin.css';

const AdminVehiclesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'create', 'edit'
  const [formData, setFormData] = useState({
    vehicleType: 'motorbike',
    licensePlate: '',
    capacity: '',
    requiredLicense: 'A1',
    currentLocationLat: '',
    currentLocationLng: '',
    status: 'available'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, vehiclesData] = await Promise.all([
        vehicleService.getVehicleStatistics(),
        vehicleService.getAllVehicles()
      ]);
      setStatistics(statsData);
      setVehicles(vehiclesData);
      setLoading(false);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load vehicles data');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedVehicle(null);
    setFormData({
      vehicleType: 'motorbike',
      licensePlate: '',
      capacity: '',
      requiredLicense: 'A1',
      currentLocationLat: '',
      currentLocationLng: '',
      status: 'available'
    });
    setShowModal(true);
  };

  const handleEdit = (vehicle) => {
    setModalMode('edit');
    setSelectedVehicle(vehicle);
    setFormData({
      vehicleType: vehicle.vehicleType,
      licensePlate: vehicle.licensePlate,
      capacity: vehicle.capacity,
      requiredLicense: vehicle.requiredLicense,
      currentLocationLat: vehicle.currentLocationLat || '',
      currentLocationLng: vehicle.currentLocationLng || '',
      status: vehicle.status
    });
    setShowModal(true);
  };

  const handleView = (vehicle) => {
    setModalMode('view');
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await vehicleService.deleteVehicle(vehicleId);
      await loadData();
      alert('Vehicle deleted successfully');
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to delete vehicle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await vehicleService.createVehicle(formData);
        alert('Vehicle created successfully');
      } else if (modalMode === 'edit') {
        await vehicleService.updateVehicle(selectedVehicle.vehicleId, formData);
        alert('Vehicle updated successfully');
      }
      
      setShowModal(false);
      await loadData();
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to save vehicle');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10b981';
      case 'in_use': return '#3b82f6';
      case 'maintenance': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'Available';
      case 'in_use': return 'In Use';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const getVehicleTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'motorbike': return '🏍️ Motorbike';
      case 'van': return '🚐 Van';
      case 'truck': return '🚚 Truck';
      case 'container': return '📦 Container';
      default: return type;
    }
  };

  const getVehicleTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'motorbike': return '#f59e0b';
      case 'van': return '#3b82f6';
      case 'truck': return '#8b5cf6';
      case 'container': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading vehicles data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        margin: '20px'
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  // Prepare chart data
  const statusChartData = statistics ? [
    { name: 'Available', value: statistics.availableVehicles, color: '#10b981' },
    { name: 'In Use', value: statistics.inUseVehicles, color: '#3b82f6' },
    { name: 'Maintenance', value: statistics.maintenanceVehicles, color: '#ef4444' }
  ].filter(item => item.value > 0) : [];

  const typeChartData = statistics ? [
    { type: 'Motorbike', count: statistics.motorbikes },
    { type: 'Van', count: statistics.vans },
    { type: 'Truck', count: statistics.trucks },
    { type: 'Container', count: statistics.containers }
  ].filter(item => item.count > 0) : [];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1f2937', 
            margin: '0 0 8px 0' 
          }}>
            🚗 Vehicle Management
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Manage your fleet of vehicles
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '12px 24px',
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
          ➕ Add New Vehicle
        </button>
      </div>

      {/* Charts */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '20px', 
        marginBottom: '24px' 
      }}>
        {/* Status Distribution */}
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
            Status Distribution
          </h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
              No data available
            </div>
          )}
        </div>

        {/* Vehicle Type Distribution */}
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
            Fleet Composition
          </h3>
          {typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Vehicles Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            All Vehicles ({vehicles.length})
          </h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  LICENSE PLATE
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  TYPE
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  CAPACITY
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  LICENSE REQ.
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  TRIPS
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(vehicle => (
                <tr key={vehicle.vehicleId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                    {vehicle.licensePlate}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: `${getVehicleTypeColor(vehicle.vehicleType)}20`,
                      color: getVehicleTypeColor(vehicle.vehicleType)
                    }}>
                      {getVehicleTypeLabel(vehicle.vehicleType)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    {(vehicle.capacity / 1000).toFixed(1)} T
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    {vehicle.requiredLicense}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: `${getStatusColor(vehicle.status)}20`,
                      color: getStatusColor(vehicle.status)
                    }}>
                      {getStatusLabel(vehicle.status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    {vehicle.totalTrips || 0} ({vehicle.activeTrips || 0} active)
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleView(vehicle)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280'
                        }}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleEdit(vehicle)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dbeafe',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#3b82f6'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.vehicleId)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#ef4444'
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

        {vehicles.length === 0 && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            No vehicles found. Click "Add New Vehicle" to create one.
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
                {modalMode === 'view' ? '👁️ View Vehicle' : modalMode === 'create' ? '➕ Add New Vehicle' : '✏️ Edit Vehicle'}
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

            {modalMode === 'view' && selectedVehicle ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <strong>License Plate:</strong> {selectedVehicle.licensePlate}
                </div>
                <div>
                  <strong>Type:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: `${getVehicleTypeColor(selectedVehicle.vehicleType)}20`,
                    color: getVehicleTypeColor(selectedVehicle.vehicleType)
                  }}>
                    {getVehicleTypeLabel(selectedVehicle.vehicleType)}
                  </span>
                </div>
                <div>
                  <strong>Capacity:</strong> {(selectedVehicle.capacity / 1000).toFixed(1)} T
                </div>
                <div>
                  <strong>Required License:</strong> {selectedVehicle.requiredLicense}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: `${getStatusColor(selectedVehicle.status)}20`,
                    color: getStatusColor(selectedVehicle.status)
                  }}>
                    {getStatusLabel(selectedVehicle.status)}
                  </span>
                </div>
                <div>
                  <strong>Total Trips:</strong> {selectedVehicle.totalTrips || 0}
                </div>
                <div>
                  <strong>Active Trips:</strong> {selectedVehicle.activeTrips || 0}
                </div>
                {selectedVehicle.currentLocationLat && selectedVehicle.currentLocationLng && (
                  <div>
                    <strong>Current Location:</strong><br />
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      Lat: {selectedVehicle.currentLocationLat}, Lng: {selectedVehicle.currentLocationLng}
                    </span>
                  </div>
                )}
                <div>
                  <strong>Created:</strong>{' '}
                  {new Date(selectedVehicle.createdAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                    License Plate *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 29A-12345"
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
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
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
                    <option value="motorbike">🏍️ Motorbike</option>
                    <option value="van">🚐 Van</option>
                    <option value="truck">🚚 Truck</option>
                    <option value="container">📦 Container</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                    Capacity (T) *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="e.g., 150"
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
                    Required License *
                  </label>
                  <select
                    name="requiredLicense"
                    value={formData.requiredLicense}
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
                    <option value="A1">A1 (Motorbike)</option>
                    <option value="A2">A2 (Motorbike)</option>
                    <option value="B1">B1 (Car/Van)</option>
                    <option value="B2">B2 (Car/Van)</option>
                    <option value="C">C (Truck)</option>
                    <option value="D">D (Bus)</option>
                    <option value="E">E (Trailer)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
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
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                      Location Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="currentLocationLat"
                      value={formData.currentLocationLat}
                      onChange={handleInputChange}
                      placeholder="e.g., 21.028511"
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
                      Location Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="currentLocationLng"
                      value={formData.currentLocationLng}
                      onChange={handleInputChange}
                      placeholder="e.g., 105.804817"
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
                    {modalMode === 'create' ? 'Create Vehicle' : 'Update Vehicle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
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

export default AdminVehiclesPage;

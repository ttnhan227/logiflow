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
    // Core fleet management
    vehicleType: 'truck',
    licensePlate: '',
    capacityTons: '',
    requiredLicense: 'C',

    // Specifications
    make: '',
    model: '',
    fuelType: 'diesel',

    // Compliance & Safety
    registrationExpiryDate: '',
    insuranceExpiryDate: '',
    lastSafetyInspectionDate: '',
    nextSafetyInspectionDueDate: '',

    // Maintenance
    lastMaintenanceDate: '',
    nextMaintenanceDueDate: '',

    // Operational
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
      // Core fleet management
      vehicleType: 'truck',
      licensePlate: '',
      capacityTons: '',
      requiredLicense: 'C',

      // Specifications
      make: '',
      model: '',
      fuelType: 'diesel',

      // Compliance & Safety
      registrationExpiryDate: '',
      insuranceExpiryDate: '',
      lastSafetyInspectionDate: '',
      nextSafetyInspectionDueDate: '',

      // Maintenance
      lastMaintenanceDate: '',
      nextMaintenanceDueDate: '',

      // Operational
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
      // Core fleet management
      vehicleType: vehicle.vehicleType || 'truck',
      licensePlate: vehicle.licensePlate || '',
      capacityTons: vehicle.capacityTons || '',
      requiredLicense: vehicle.requiredLicense || 'C',

      // Specifications
      make: vehicle.make || '',
      model: vehicle.model || '',
      fuelType: vehicle.fuelType || 'diesel',

      // Compliance & Safety
      registrationExpiryDate: vehicle.registrationExpiryDate || '',
      insuranceExpiryDate: vehicle.insuranceExpiryDate || '',
      lastSafetyInspectionDate: vehicle.lastSafetyInspectionDate || '',
      nextSafetyInspectionDueDate: vehicle.nextSafetyInspectionDueDate || '',

      // Maintenance
      lastMaintenanceDate: vehicle.lastMaintenanceDate || '',
      nextMaintenanceDueDate: vehicle.nextMaintenanceDueDate || '',

      // Operational
      currentLocationLat: vehicle.currentLocationLat || '',
      currentLocationLng: vehicle.currentLocationLng || '',
      status: vehicle.status || 'available'
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
      case 'van': return '🚐 Van';
      case 'truck': return '🚚 Truck';
      case 'container': return '📦 Container';
      default: return type;
    }
  };

  const getVehicleTypeColor = (type) => {
    switch (type?.toLowerCase()) {
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

      {/* Performance Analytics Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
          📊 Fleet Performance Analytics
        </h3>

        {/* Performance Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            borderRadius: '12px',
            border: '1px solid #bfdbfe',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>
              {vehicles.filter(v => v.totalTrips > 0).length}
            </div>
            <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
              Active Vehicles
            </div>
            <div style={{ fontSize: '12px', color: '#3730a3', marginTop: '4px' }}>
              With trip history
            </div>
          </div>

          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534', marginBottom: '8px' }}>
              {vehicles.reduce((acc, v) => acc + (v.totalDistanceDrivenKm || 0), 0).toLocaleString()} km
            </div>
            <div style={{ fontSize: '14px', color: '#166534', fontWeight: '600' }}>
              Total Distance Driven
            </div>
            <div style={{ fontSize: '12px', color: '#14532d', marginTop: '4px' }}>
              Fleet-wide mileage
            </div>
          </div>

          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            border: '1px solid #fde68a',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
              {vehicles.reduce((acc, v) => acc + (v.totalFuelConsumedLiters || 0), 0).toLocaleString()} L
            </div>
            <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '600' }}>
              Total Fuel Consumed
            </div>
            <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
              Fuel usage tracking
            </div>
          </div>

          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
            borderRadius: '12px',
            border: '1px solid #fbcfe8',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#be185d', marginBottom: '8px' }}>
              {vehicles.reduce((acc, v) => acc + (v.totalMaintenanceCost || 0), 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
            </div>
            <div style={{ fontSize: '14px', color: '#be185d', fontWeight: '600' }}>
              Maintenance Costs
            </div>
            <div style={{ fontSize: '12px', color: '#9d174d', marginTop: '4px' }}>
              Total repair expenses
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Fuel Efficiency Chart */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>⛽ Fuel Efficiency by Vehicle</h4>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehicles
                    .filter(v => v.totalDistanceDrivenKm > 0 && v.totalFuelConsumedLiters > 0)
                    .map(v => ({
                      name: v.licensePlate,
                      efficiency: Math.round((v.totalDistanceDrivenKm / v.totalFuelConsumedLiters) * 100) / 100,
                      fuelUsed: v.totalFuelConsumedLiters
                    }))
                    .sort((a, b) => b.efficiency - a.efficiency)
                    .slice(0, 10)
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis label={{ value: 'km/L', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} km/L`, 'Fuel Efficiency']} />
                  <Bar dataKey="efficiency" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Analysis Chart */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>💰 Cost per Kilometer by Vehicle</h4>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehicles
                    .filter(v => v.totalDistanceDrivenKm > 0)
                    .map(v => {
                      const totalCost = (v.totalFuelConsumedLiters || 0) * 25000 + (v.totalMaintenanceCost || 0); // Assuming fuel cost ~25k VND/L
                      const costPerKm = totalCost / v.totalDistanceDrivenKm;
                      return {
                        name: v.licensePlate,
                        costPerKm: Math.round(costPerKm),
                        distance: v.totalDistanceDrivenKm
                      };
                    })
                    .sort((a, b) => a.costPerKm - b.costPerKm)
                    .slice(0, 10)
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis label={{ value: 'VND/km', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Cost per km']} />
                  <Bar dataKey="costPerKm" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
                    {vehicle.capacityTons ? `${vehicle.capacityTons} T` : 'N/A'}
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
            maxWidth: modalMode === 'view' ? '900px' : '1000px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Basic Information */}
                <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>📋 Basic Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div><strong>License Plate:</strong> {selectedVehicle.licensePlate}</div>
                    <div><strong>VIN:</strong> {selectedVehicle.vin || 'N/A'}</div>
                    <div><strong>Type:</strong> {getVehicleTypeLabel(selectedVehicle.vehicleType)}</div>
                    <div><strong>Status:</strong> {getStatusLabel(selectedVehicle.status)}</div>
                    <div><strong>Capacity:</strong> {selectedVehicle.capacityTons ? `${selectedVehicle.capacityTons} T` : 'N/A'}</div>
                    <div><strong>Cubic Capacity:</strong> {selectedVehicle.capacityCubicMeters ? `${selectedVehicle.capacityCubicMeters} m³` : 'N/A'}</div>
                  </div>
                </div>

                {/* Specifications */}
                {(selectedVehicle.make || selectedVehicle.model || selectedVehicle.year) && (
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>🚗 Specifications</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div><strong>Make:</strong> {selectedVehicle.make || 'N/A'}</div>
                      <div><strong>Model:</strong> {selectedVehicle.model || 'N/A'}</div>
                      <div><strong>Year:</strong> {selectedVehicle.year || 'N/A'}</div>
                      <div><strong>Engine Type:</strong> {selectedVehicle.engineType || 'N/A'}</div>
                      <div><strong>Fuel Type:</strong> {selectedVehicle.fuelType || 'N/A'}</div>
                      <div><strong>Fuel Capacity:</strong> {selectedVehicle.fuelCapacityLiters ? `${selectedVehicle.fuelCapacityLiters} L` : 'N/A'}</div>
                      <div><strong>Fuel Consumption:</strong> {selectedVehicle.averageFuelConsumptionLPer100km ? `${selectedVehicle.averageFuelConsumptionLPer100km} L/100km` : 'N/A'}</div>
                      <div><strong>Dimensions:</strong> {selectedVehicle.lengthCm && selectedVehicle.widthCm && selectedVehicle.heightCm ? `${selectedVehicle.lengthCm}x${selectedVehicle.widthCm}x${selectedVehicle.heightCm} cm` : 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* Compliance & Insurance */}
                <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>🛡️ Compliance & Insurance</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div><strong>Required License:</strong> {selectedVehicle.requiredLicense}</div>
                    <div><strong>Registration #:</strong> {selectedVehicle.registrationNumber || 'N/A'}</div>
                    <div><strong>Registration Expiry:</strong> {selectedVehicle.registrationExpiryDate ? new Date(selectedVehicle.registrationExpiryDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Insurance Provider:</strong> {selectedVehicle.insuranceProvider || 'N/A'}</div>
                    <div><strong>Insurance Policy:</strong> {selectedVehicle.insurancePolicyNumber || 'N/A'}</div>
                    <div><strong>Insurance Expiry:</strong> {selectedVehicle.insuranceExpiryDate ? new Date(selectedVehicle.insuranceExpiryDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Coverage Amount:</strong> {selectedVehicle.insuranceCoverageAmount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVehicle.insuranceCoverageAmount) : 'N/A'}</div>
                  </div>
                </div>

                {/* Asset Information */}
                {(selectedVehicle.purchaseDate || selectedVehicle.purchasePrice) && (
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>💰 Asset Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div><strong>Purchase Date:</strong> {selectedVehicle.purchaseDate ? new Date(selectedVehicle.purchaseDate).toLocaleDateString() : 'N/A'}</div>
                      <div><strong>Purchase Price:</strong> {selectedVehicle.purchasePrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVehicle.purchasePrice) : 'N/A'}</div>
                      <div><strong>Current Value:</strong> {selectedVehicle.currentMarketValue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVehicle.currentMarketValue) : 'N/A'}</div>
                      <div><strong>Depreciation:</strong> {selectedVehicle.depreciationMethod ? selectedVehicle.depreciationMethod.replace('_', ' ') : 'N/A'}</div>
                      <div><strong>Useful Life:</strong> {selectedVehicle.usefulLifeYears ? `${selectedVehicle.usefulLifeYears} years` : 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* Maintenance & Inspections */}
                <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>🔧 Maintenance & Inspections</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div><strong>Last Maintenance:</strong> {selectedVehicle.lastMaintenanceDate ? new Date(selectedVehicle.lastMaintenanceDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Next Maintenance:</strong> {selectedVehicle.nextMaintenanceDueDate ? new Date(selectedVehicle.nextMaintenanceDueDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Last Safety Insp.:</strong> {selectedVehicle.lastSafetyInspectionDate ? new Date(selectedVehicle.lastSafetyInspectionDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Next Safety Insp.:</strong> {selectedVehicle.nextSafetyInspectionDueDate ? new Date(selectedVehicle.nextSafetyInspectionDueDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Emission Test Expiry:</strong> {selectedVehicle.emissionTestExpiryDate ? new Date(selectedVehicle.emissionTestExpiryDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>📊 Performance Metrics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div><strong>Total Distance:</strong> {selectedVehicle.totalDistanceDrivenKm ? `${selectedVehicle.totalDistanceDrivenKm.toFixed(1)} km` : 'N/A'}</div>
                    <div><strong>Total Fuel Used:</strong> {selectedVehicle.totalFuelConsumedLiters ? `${selectedVehicle.totalFuelConsumedLiters.toFixed(1)} L` : 'N/A'}</div>
                    <div><strong>Maintenance Cost:</strong> {selectedVehicle.totalMaintenanceCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVehicle.totalMaintenanceCost) : 'N/A'}</div>
                    <div><strong>Operating Hours:</strong> {selectedVehicle.totalOperatingHours ? `${selectedVehicle.totalOperatingHours} hrs` : 'N/A'}</div>
                    <div><strong>Total Trips:</strong> {selectedVehicle.totalTrips || 0}</div>
                    <div><strong>Active Trips:</strong> {selectedVehicle.activeTrips || 0}</div>
                  </div>
                </div>

                {/* Business Allocation */}
                <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>🏢 Business Allocation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div><strong>Department:</strong> {selectedVehicle.assignedDepartment || 'N/A'}</div>
                    <div><strong>Cost Center:</strong> {selectedVehicle.costCenter || 'N/A'}</div>
                    <div><strong>Assigned Driver ID:</strong> {selectedVehicle.assignedDriverId || 'N/A'}</div>
                    {selectedVehicle.currentLocationLat && selectedVehicle.currentLocationLng && (
                      <div><strong>Location:</strong> {selectedVehicle.currentLocationLat.toFixed(6)}, {selectedVehicle.currentLocationLng.toFixed(6)}</div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedVehicle.notes && (
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>📝 Notes</h4>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                      {selectedVehicle.notes}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div style={{ fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                  <div><strong>Created:</strong> {new Date(selectedVehicle.createdAt).toLocaleString()}</div>
                  {selectedVehicle.updatedAt && <div><strong>Last Updated:</strong> {new Date(selectedVehicle.updatedAt).toLocaleString()}</div>}
                </div>
              </div>
            ) : modalMode === 'create' || modalMode === 'edit' ? (
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Basic Information Section */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '16px' }}>📋 Basic Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                          VIN
                        </label>
                        <input
                          type="text"
                          name="vin"
                          value={formData.vin}
                          onChange={handleInputChange}
                          placeholder="Vehicle Identification Number"
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
                          <option value="van">🚐 Van</option>
                          <option value="truck">🚚 Truck</option>
                          <option value="container">📦 Container Truck</option>
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
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Capacity (Tons) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="capacityTons"
                          value={formData.capacityTons}
                          onChange={handleInputChange}
                          required
                          min="0.1"
                          placeholder="e.g., 15.0"
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
                          Cubic Capacity (m³)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="capacityCubicMeters"
                          value={formData.capacityCubicMeters}
                          onChange={handleInputChange}
                          placeholder="e.g., 25.5"
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
                  </div>

                  {/* Specifications Section */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '16px' }}>🚗 Vehicle Specifications</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Make
                        </label>
                        <input
                          type="text"
                          name="make"
                          value={formData.make}
                          onChange={handleInputChange}
                          placeholder="e.g., Mercedes-Benz"
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
                          Model
                        </label>
                        <input
                          type="text"
                          name="model"
                          value={formData.model}
                          onChange={handleInputChange}
                          placeholder="e.g., Actros 1845"
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
                          Year
                        </label>
                        <input
                          type="number"
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          placeholder="e.g., 2022"
                          min="1990"
                          max={new Date().getFullYear() + 1}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Engine Type
                        </label>
                        <input
                          type="text"
                          name="engineType"
                          value={formData.engineType}
                          onChange={handleInputChange}
                          placeholder="e.g., Diesel Euro 6"
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
                          Fuel Type
                        </label>
                        <select
                          name="fuelType"
                          value={formData.fuelType}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="diesel">Diesel</option>
                          <option value="petrol">Petrol</option>
                          <option value="lng">LNG</option>
                          <option value="electric">Electric</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Fuel Capacity (L)
                        </label>
                        <input
                          type="number"
                          name="fuelCapacityLiters"
                          value={formData.fuelCapacityLiters}
                          onChange={handleInputChange}
                          placeholder="e.g., 400"
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
                  </div>

                  {/* Compliance & Business Section */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '16px' }}>🛡️ Compliance & Business</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                          <option value="B1">B1 (Car/Van)</option>
                          <option value="B2">B2 (Car/Van)</option>
                          <option value="C">C (Truck)</option>
                          <option value="D">D (Bus)</option>
                          <option value="E">E (Trailer)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Registration Number
                        </label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          placeholder="Registration number"
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
                          Department
                        </label>
                        <input
                          type="text"
                          name="assignedDepartment"
                          value={formData.assignedDepartment}
                          onChange={handleInputChange}
                          placeholder="e.g., Logistics, Distribution"
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
                          Cost Center
                        </label>
                        <input
                          type="text"
                          name="costCenter"
                          value={formData.costCenter}
                          onChange={handleInputChange}
                          placeholder="Cost center code"
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
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      {modalMode === 'create' ? '➕ Create Vehicle' : '💾 Update Vehicle'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
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
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehiclesPage;

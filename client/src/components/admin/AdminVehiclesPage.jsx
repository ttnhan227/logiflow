import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { vehicleService } from '../../services';
import {
  Button,
  Card,
  StatCard,
  Input,
  Select,
  Badge,
  Modal,
  PageHeader,
  Alert,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import {
  LuTruck,
  LuPlus,
  LuEye,
  LuPencil,
  LuTrash2,
  LuFuel,
  LuGauge,
  LuWrench,
  LuActivity,
} from 'react-icons/lu';

export const AdminVehiclesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicleType: 'truck',
    licensePlate: '',
    capacityTons: '',
    requiredLicense: 'C',
    make: '',
    model: '',
    fuelType: 'diesel',
    registrationExpiryDate: '',
    insuranceExpiryDate: '',
    lastSafetyInspectionDate: '',
    nextSafetyInspectionDueDate: '',
    lastMaintenanceDate: '',
    nextMaintenanceDueDate: '',
    status: 'available',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, vehiclesData] = await Promise.all([
        vehicleService.getVehicleStatistics(),
        vehicleService.getAllVehicles(),
      ]);
      setStatistics(statsData);
      setVehicles(vehiclesData || []);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to query fleet registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedVehicle(null);
    setFormData({
      vehicleType: 'truck',
      licensePlate: '',
      capacityTons: '',
      requiredLicense: 'C',
      make: '',
      model: '',
      fuelType: 'diesel',
      registrationExpiryDate: '',
      insuranceExpiryDate: '',
      lastSafetyInspectionDate: '',
      nextSafetyInspectionDueDate: '',
      lastMaintenanceDate: '',
      nextMaintenanceDueDate: '',
      status: 'available',
    });
    setShowModal(true);
  };

  const handleEdit = (vehicle) => {
    setModalMode('edit');
    setSelectedVehicle(vehicle);
    setFormData({
      vehicleType: vehicle.vehicleType || 'truck',
      licensePlate: vehicle.licensePlate || '',
      capacityTons: vehicle.capacityTons || '',
      requiredLicense: vehicle.requiredLicense || 'C',
      make: vehicle.make || '',
      model: vehicle.model || '',
      fuelType: vehicle.fuelType || 'diesel',
      registrationExpiryDate: vehicle.registrationExpiryDate || '',
      insuranceExpiryDate: vehicle.insuranceExpiryDate || '',
      lastSafetyInspectionDate: vehicle.lastSafetyInspectionDate || '',
      nextSafetyInspectionDueDate: vehicle.nextSafetyInspectionDueDate || '',
      lastMaintenanceDate: vehicle.lastMaintenanceDate || '',
      nextMaintenanceDueDate: vehicle.nextMaintenanceDueDate || '',
      status: vehicle.status || 'available',
    });
    setShowModal(true);
  };

  const handleView = (vehicle) => {
    setModalMode('view');
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to decommission and remove this vehicle?')) return;
    try {
      await vehicleService.deleteVehicle(vehicleId);
      await loadData();
    } catch {
      alert('Failed to decommission vehicle.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await vehicleService.createVehicle(formData);
      } else if (modalMode === 'edit') {
        await vehicleService.updateVehicle(selectedVehicle.vehicleId, formData);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to save vehicle data.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusChartData = statistics
    ? [
        { name: 'Available', value: statistics.availableVehicles || 0, color: '#059669' },
        { name: 'In Service', value: statistics.inUseVehicles || 0, color: '#2563eb' },
        { name: 'Maintenance', value: statistics.maintenanceVehicles || 0, color: '#dc2626' },
      ].filter((i) => i.value > 0)
    : [];

  const totalDistance = vehicles.reduce((s, v) => s + (v.totalDistanceDrivenKm || 0), 0);
  const totalFuel = vehicles.reduce((s, v) => s + (v.totalFuelConsumedLiters || 0), 0);
  const totalMaintCost = vehicles.reduce((s, v) => s + (v.totalMaintenanceCost || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Fleet Vehicle Registry & Assets"
        description="Monitor physical truck assets, cargo capacity classes, fuel economy, maintenance records, and DOT compliance."
        badge={<Badge variant="brand">Fleet Asset Management</Badge>}
        actions={
          <Button variant="primary" size="sm" onClick={handleCreate} leftIcon={<LuPlus size={16} />}>
            Add Vehicle Asset
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Fleet Assets"
          value={vehicles.length}
          icon={<LuTruck size={20} />}
          description={`${statistics?.availableVehicles || 0} active & available`}
        />
        <StatCard
          title="Total Distance Logged"
          value={`${totalDistance.toLocaleString()} km`}
          icon={<LuGauge size={20} />}
          description="Cumulative fleet linehaul"
        />
        <StatCard
          title="Fuel Consumption"
          value={`${totalFuel.toLocaleString()} L`}
          icon={<LuFuel size={20} />}
          description="Diesel & heavy fuel volume"
        />
        <StatCard
          title="Total Maintenance Cost"
          value={`${totalMaintCost.toLocaleString()} VND`}
          icon={<LuWrench size={20} />}
          description="Preventive repairs & service"
        />
      </div>

      {/* Fleet Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Fleet Readiness Breakdown
          </h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" paddingAngle={4}>
                  {statusChartData.map((e, idx) => (
                    <Cell key={`cell-${idx}`} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
            {statusChartData.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                <span>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Fuel Efficiency (Top Active Vehicles)
          </h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vehicles
                  .filter((v) => v.totalDistanceDrivenKm > 0 && v.totalFuelConsumedLiters > 0)
                  .map((v) => ({
                    plate: v.licensePlate,
                    kmPerL: Math.round((v.totalDistanceDrivenKm / v.totalFuelConsumedLiters) * 10) / 10,
                  }))
                  .slice(0, 6)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="plate" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="kmPerL" fill="#059669" radius={[4, 4, 0, 0]} name="km/L" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            Vehicle Assets Registry ({vehicles.length})
          </strong>
        </div>

        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Retrieving vehicle assets..." />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={<LuTruck size={36} color="var(--color-slate-400)" />}
            title="No fleet vehicles registered"
            description="Add commercial transport vehicles to begin dispatching orders."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Plate</TableHead>
                <TableHead>Vehicle Class</TableHead>
                <TableHead>Payload Capacity</TableHead>
                <TableHead>Required CDL</TableHead>
                <TableHead>Operational State</TableHead>
                <TableHead>Total Distance</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v.vehicleId}>
                  <TableCell style={{ fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                    {v.licensePlate}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {v.vehicleType?.toUpperCase() || 'TRUCK'}
                    </Badge>
                    {v.make && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{v.make}</span>}
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {v.capacityTons ? `${v.capacityTons} T` : '—'}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Class {v.requiredLicense || 'C'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={v.status === 'available' ? 'success' : v.status === 'in_use' ? 'info' : 'danger'}
                      size="sm"
                      dot
                    >
                      {v.status === 'available' ? 'Available' : v.status === 'in_use' ? 'In Use' : 'Maintenance'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontSize: '11px' }}>
                    {v.totalDistanceDrivenKm ? `${v.totalDistanceDrivenKm.toFixed(1)} km` : '0 km'}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <Button variant="ghost" size="sm" onClick={() => handleView(v)} title="View Specs">
                        <LuEye size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(v)} title="Edit Vehicle">
                        <LuPencil size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(v.vehicleId)} title="Decommission">
                        <LuTrash2 size={14} color="var(--color-danger-600)" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal View / Create / Edit */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalMode === 'view'
              ? `Vehicle Specs • ${selectedVehicle?.licensePlate}`
              : modalMode === 'create'
              ? 'Register New Fleet Vehicle Asset'
              : `Edit Vehicle Asset • ${selectedVehicle?.licensePlate}`
          }
          description="Maintain chassis specifications, DOT safety inspections, and payload limits."
        >
          {modalMode === 'view' && selectedVehicle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: 'var(--text-xs)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Class:</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>{selectedVehicle.vehicleType}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Capacity:</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>{selectedVehicle.capacityTons} T</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Required CDL:</span>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>Class {selectedVehicle.requiredLicense}</div>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '12px' }}>Compliance & DOT Inspections</strong>
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                  <div>Registration Expiry: {selectedVehicle.registrationExpiryDate || 'N/A'}</div>
                  <div>Insurance Policy Expiry: {selectedVehicle.insuranceExpiryDate || 'N/A'}</div>
                  <div>Last Safety Inspection: {selectedVehicle.lastSafetyInspectionDate || 'N/A'}</div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="License Plate *"
                  required
                  value={formData.licensePlate}
                  onChange={(e) => setFormData((p) => ({ ...p, licensePlate: e.target.value }))}
                  placeholder="29C-12345"
                />
                <Select
                  label="Vehicle Category *"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData((p) => ({ ...p, vehicleType: e.target.value }))}
                  options={[
                    { value: 'truck', label: 'Heavy Truck' },
                    { value: 'container', label: 'Intermodal Container' },
                    { value: 'van', label: 'Commercial Van' },
                  ]}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Payload Capacity (Tons) *"
                  type="number"
                  step="0.1"
                  required
                  value={formData.capacityTons}
                  onChange={(e) => setFormData((p) => ({ ...p, capacityTons: e.target.value }))}
                  placeholder="8.5"
                />
                <Select
                  label="Required License Class"
                  value={formData.requiredLicense}
                  onChange={(e) => setFormData((p) => ({ ...p, requiredLicense: e.target.value }))}
                  options={[
                    { value: 'B2', label: 'Class B2 (Light Commercial)' },
                    { value: 'C', label: 'Class C (Heavy Rigid)' },
                    { value: 'FC', label: 'Class FC (Articulated Tractor)' },
                  ]}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Make & Model"
                  value={formData.make}
                  onChange={(e) => setFormData((p) => ({ ...p, make: e.target.value }))}
                  placeholder="Hino 500 Series"
                />
                <Select
                  label="Fleet Status"
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  options={[
                    { value: 'available', label: 'Available for Dispatch' },
                    { value: 'in_use', label: 'In Service / On Trip' },
                    { value: 'maintenance', label: 'Under Maintenance' },
                  ]}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={submitting}>
                  {modalMode === 'create' ? 'Register Asset' : 'Save Specs'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AdminVehiclesPage;

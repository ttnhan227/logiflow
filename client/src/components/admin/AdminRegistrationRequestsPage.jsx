import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
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
  LuSearch,
  LuFileCheck,
  LuUserCheck,
  LuBuilding2,
  LuTruck,
  LuEye,
} from 'react-icons/lu';

export const AdminRegistrationRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const size = 10;

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/registration-requests');
      const data = Array.isArray(res.data) ? res.data : [];
      setRequests(data);
      setFilteredRequests(data);
    } catch {
      setError('Failed to query registration applications queue.');
      setRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let result = requests;
    if (roleFilter !== 'ALL') {
      result = result.filter((r) => r.role?.roleName === roleFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.fullName?.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term) ||
          r.phone?.toLowerCase().includes(term) ||
          r.companyName?.toLowerCase().includes(term)
      );
    }
    setFilteredRequests(result);
    setPage(0);
  }, [searchTerm, roleFilter, requests]);

  const paginatedRequests = filteredRequests.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredRequests.length / size);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Carrier & Shipper Onboarding Applications"
        description="Verify submitted driving licenses, commercial business registrations, CVs, and issue corporate credentials."
        badge={<Badge variant="brand">Onboarding Review</Badge>}
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search applicants by name, company, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>

          <div style={{ width: '180px' }}>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Applicant Roles' },
                { value: 'DRIVER', label: 'Carrier Drivers' },
                { value: 'CUSTOMER', label: 'Shipper Customers' },
              ]}
            />
          </div>

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filteredRequests.length} onboarding application{filteredRequests.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Querying pending onboarding requests..." />
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={<LuFileCheck size={36} color="var(--color-slate-400)" />}
            title="No registration requests"
            description="All onboarding applications have been reviewed and processed."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Email Contact</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Account Category</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Review State</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map((req) => (
                  <TableRow key={req.requestId}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {req.fullName || req.companyName || 'Applicant'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #{req.requestId}</div>
                    </TableCell>
                    <TableCell>{req.email}</TableCell>
                    <TableCell>{req.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</TableCell>
                    <TableCell>
                      <Badge variant={req.role?.roleName === 'DRIVER' ? 'brand' : 'info'} size="sm">
                        {req.role?.roleName === 'DRIVER' ? 'Carrier Driver' : 'Enterprise Shipper'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          req.status === 'APPROVED'
                            ? 'success'
                            : req.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                        dot
                      >
                        {req.status || 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Link to={`/admin/registration-requests/${req.requestId}`}>
                        <Button variant="outline" size="sm" leftIcon={<LuEye size={14} />}>
                          Review Application
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredRequests.length}
                pageSize={size}
                disabled={loading}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminRegistrationRequestsPage;

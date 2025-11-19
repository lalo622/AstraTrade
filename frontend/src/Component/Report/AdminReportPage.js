import React from 'react';
import AdminLayout from '../Component/Admin/AdminLayout';
import AdminReportList from '../Component/Admin/Report/AdminReportList';

const AdminReportPage = () => {

  const token = localStorage.getItem('token');

  return (
    <AdminLayout>
      <AdminReportList token={token} />
    </AdminLayout>
  );
};

export default AdminReportPage;
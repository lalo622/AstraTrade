import React, { useState, useEffect } from 'react';
import { Eye, Check, X, AlertTriangle, TrendingUp } from 'lucide-react';
import '../../Pages/AdminPage.css';

const AdminReportList = ({ token }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filterStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5234/api/admin/report/all?status=${filterStatus}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5234/api/admin/report/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (reportId) => {
    if (!window.confirm('Xác nhận DUYỆT báo cáo và GỠ bài đăng?')) return;

    try {
      const response = await fetch(
        `http://localhost:5234/api/admin/report/approve/${reportId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('✅ ' + data.message);
        fetchReports();
        fetchStats();
        setShowDetailModal(false);
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error approving report:', error);
      alert('Không thể duyệt báo cáo!');
    }
  };

  const handleReject = async (reportId) => {
    if (!window.confirm('Xác nhận TỪ CHỐI báo cáo này?')) return;

    try {
      const response = await fetch(
        `http://localhost:5234/api/admin/report/reject/${reportId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('✅ ' + data.message);
        fetchReports();
        fetchStats();
        setShowDetailModal(false);
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('Không thể từ chối báo cáo!');
    }
  };

  const getReportTypeBadge = (type) => {
    const badges = {
      Spam: { text: '🚫 Spam', color: 'badge-warning' },
      Scam: { text: '⚠️ Lừa đảo', color: 'badge-danger' },
      Inappropriate: { text: '🔞 Vi phạm', color: 'badge-danger' },
      Fake: { text: '❌ Hàng giả', color: 'badge-warning' },
      Other: { text: '📝 Khác', color: 'badge-secondary' },
    };
    return badges[type] || badges.Other;
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { text: 'Chờ xử lý', color: 'badge-warning' },
      Approved: { text: 'Đã duyệt', color: 'badge-success' },
      Rejected: { text: 'Đã từ chối', color: 'badge-danger' },
    };
    return badges[status] || badges.Pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="admin-content">
      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <TrendingUp size={32} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalReports}</h3>
              <p>Tổng báo cáo</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <AlertTriangle size={32} />
            </div>
            <div className="stat-info">
              <h3>{stats.pendingReports}</h3>
              <p>Chờ xử lý</p>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">
              <Check size={32} />
            </div>
            <div className="stat-info">
              <h3>{stats.approvedReports}</h3>
              <p>Đã duyệt</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <X size={32} />
            </div>
            <div className="stat-info">
              <h3>{stats.rejectedReports}</h3>
              <p>Đã từ chối</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={filterStatus === 'all' ? 'tab-active' : ''}
          onClick={() => setFilterStatus('all')}
        >
          Tất cả
        </button>
        <button
          className={filterStatus === 'Pending' ? 'tab-active' : ''}
          onClick={() => setFilterStatus('Pending')}
        >
          Chờ xử lý ({stats?.pendingReports || 0})
        </button>
        <button
          className={filterStatus === 'Approved' ? 'tab-active' : ''}
          onClick={() => setFilterStatus('Approved')}
        >
          Đã duyệt
        </button>
        <button
          className={filterStatus === 'Rejected' ? 'tab-active' : ''}
          onClick={() => setFilterStatus('Rejected')}
        >
          Đã từ chối
        </button>
      </div>

      {/* Reports Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <p>Không có báo cáo nào</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại vi phạm</th>
                <th>Tin đăng</th>
                <th>Người báo cáo</th>
                <th>Chủ tin đăng</th>
                <th>Ngày báo cáo</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const typeBadge = getReportTypeBadge(report.reportType);
                const statusBadge = getStatusBadge(report.status);

                return (
                  <tr key={report.reportID}>
                    <td>#{report.reportID}</td>
                    <td>
                      <span className={`badge ${typeBadge.color}`}>
                        {typeBadge.text}
                      </span>
                    </td>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>
                      {report.advertisement.title}
                    </td>
                    <td>{report.reporterUsername}</td>
                    <td>{report.advertisement.ownerUsername}</td>
                    <td>{formatDate(report.reportDate)}</td>
                    <td>
                      <span className={`badge ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-info"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailModal(true);
                          }}
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>

                        {report.status === 'Pending' && (
                          <>
                            <button
                              className="btn-icon btn-success"
                              onClick={() => handleApprove(report.reportID)}
                              title="Duyệt & Gỡ bài"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleReject(report.reportID)}
                              title="Từ chối"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết báo cáo #{selectedReport.reportID}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Thông tin báo cáo</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Loại vi phạm:</strong>
                    <span className={`badge ${getReportTypeBadge(selectedReport.reportType).color}`}>
                      {getReportTypeBadge(selectedReport.reportType).text}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Trạng thái:</strong>
                    <span className={`badge ${getStatusBadge(selectedReport.status).color}`}>
                      {getStatusBadge(selectedReport.status).text}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Người báo cáo:</strong>
                    <span>{selectedReport.reporterUsername} ({selectedReport.reporterEmail})</span>
                  </div>
                  <div className="detail-item">
                    <strong>Ngày báo cáo:</strong>
                    <span>{formatDate(selectedReport.reportDate)}</span>
                  </div>
                </div>

                <div className="detail-item full-width">
                  <strong>Lý do chi tiết:</strong>
                  <p className="reason-text">{selectedReport.reason}</p>
                </div>
              </div>

              <div className="detail-section">
                <h3>Thông tin tin đăng</h3>
                <div className="advertisement-preview">
                  {selectedReport.advertisement.image && (
                    <img
                      src={selectedReport.advertisement.image}
                      alt={selectedReport.advertisement.title}
                      className="ad-thumbnail"
                    />
                  )}
                  <div className="ad-info">
                    <h4>{selectedReport.advertisement.title}</h4>
                    <p><strong>Giá:</strong> {selectedReport.advertisement.price?.toLocaleString('vi-VN')} ₫</p>
                    <p><strong>Chủ tin:</strong> {selectedReport.advertisement.ownerUsername}</p>
                    <p><strong>Email:</strong> {selectedReport.advertisement.ownerEmail}</p>
                    <p className="ad-description">{selectedReport.advertisement.description}</p>
                  </div>
                </div>
              </div>

              {selectedReport.status === 'Pending' && (
                <div className="modal-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleApprove(selectedReport.reportID)}
                  >
                    <Check size={20} /> Duyệt báo cáo & Gỡ bài
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleReject(selectedReport.reportID)}
                  >
                    <X size={20} /> Từ chối báo cáo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportList;
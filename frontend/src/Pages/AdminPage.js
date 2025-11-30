import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "axios";

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [usersChart, setUsersChart] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [adsChart, setAdsChart] = useState([]);
  const [popularPackages, setPopularPackages] = useState([]);
  const [adsByStatus, setAdsByStatus] = useState(null);
  const [recentActivities, setRecentActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  const API_BASE = "http://localhost:5234/api/admin/dashboard";

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        overviewRes,
        usersRes,
        revenueRes,
        adsRes,
        packagesRes,
        statusRes,
        activitiesRes
      ] = await Promise.all([
        axios.get(`${API_BASE}/overview`),
        axios.get(`${API_BASE}/users-chart?period=${period}`),
        axios.get(`${API_BASE}/revenue-chart?period=${period}`),
        axios.get(`${API_BASE}/advertisements-chart?period=${period}`),
        axios.get(`${API_BASE}/popular-packages`),
        axios.get(`${API_BASE}/advertisements-by-status`),
        axios.get(`${API_BASE}/recent-activities`)
      ]);

      setOverview(overviewRes.data);
      setUsersChart(usersRes.data);
      setRevenueChart(revenueRes.data);
      setAdsChart(adsRes.data);
      setPopularPackages(packagesRes.data);
      setAdsByStatus(statusRes.data);
      setRecentActivities(activitiesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return "↑";
    if (growth < 0) return "↓";
    return "→";
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Tổng quan hoạt động hệ thống</p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod("week")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "week"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          7 ngày
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "month"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          30 ngày
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "year"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          12 tháng
        </button>
      </div>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Người dùng</p>
                <p className="text-3xl font-bold text-gray-800">
                  {formatNumber(overview.users.total)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className={`font-semibold mr-2 ${getGrowthColor(overview.users.growth)}`}>
                {getGrowthIcon(overview.users.growth)} {Math.abs(overview.users.growth).toFixed(1)}%
              </span>
              <span className="text-gray-600">so với tháng trước</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Doanh thu</p>
                <p className="text-3xl font-bold text-gray-800">
                  {formatCurrency(overview.revenue.total)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className={`font-semibold mr-2 ${getGrowthColor(overview.revenue.growth)}`}>
                {getGrowthIcon(overview.revenue.growth)} {Math.abs(overview.revenue.growth).toFixed(1)}%
              </span>
              <span className="text-gray-600">so với tháng trước</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Bài đăng</p>
                <p className="text-3xl font-bold text-gray-800">
                  {formatNumber(overview.advertisements.total)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className={`font-semibold mr-2 ${getGrowthColor(overview.advertisements.growth)}`}>
                {getGrowthIcon(overview.advertisements.growth)} {Math.abs(overview.advertisements.growth).toFixed(1)}%
              </span>
              <span className="text-gray-600">so với tháng trước</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">VIP Users</p>
                <p className="text-3xl font-bold text-gray-800">
                  {formatNumber(overview.vipUsers)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-600">Thành viên cao cấp</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Người dùng mới</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usersChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" strokeWidth={2} name="Người dùng mới" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Doanh thu</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Bài đăng mới</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={adsChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newAds" stroke="#f59e0b" strokeWidth={2} name="Bài đăng mới" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {adsByStatus && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Trạng thái bài đăng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Chờ duyệt", value: adsByStatus.pending },
                    { name: "Đã duyệt", value: adsByStatus.approved },
                    { name: "Từ chối", value: adsByStatus.rejected }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {popularPackages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Gói dịch vụ phổ biến</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gói dịch vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {popularPackages.map((pkg, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pkg.packageName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatNumber(pkg.subscriptions)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(pkg.revenue)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentActivities && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Bài đăng gần đây</h2>
            <div className="space-y-4">
              {recentActivities.recentAds.map((ad) => (
                <div key={ad.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                    <p className="text-xs text-gray-600 mt-1">Bởi: {ad.userName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(ad.date).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    ad.status === "Approved" ? "bg-green-100 text-green-800" :
                    ad.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {ad.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thanh toán gần đây</h2>
            <div className="space-y-4">
              {recentActivities.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Bởi: {payment.userName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(payment.date).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === "Success" || payment.status === "Completed" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
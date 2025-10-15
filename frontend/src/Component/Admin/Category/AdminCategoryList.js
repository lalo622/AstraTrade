import React, { useState, useEffect } from 'react';
import CategoryService from '../../../Service/CategoryService';
import AdminCategoryForm from './AdminCategoryForm';

const AdminCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await CategoryService.getAllCategories();
      setCategories(response.data);
    } catch (err) {
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Xóa danh mục "${name}"?`)) {
      try {
        await CategoryService.deleteCategory(id);
        loadCategories();
      } catch (err) {
        setError('Lỗi xóa: ' + err.message);
      }
    }
  };

  return (
    <div className="admin-categories">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Danh mục</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Thêm Danh mục
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {showForm && (
        <AdminCategoryForm
          category={editingCategory}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
            loadCategories();
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-3">
                    <i>Chưa có danh mục nào</i>
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category.categoryID}>
                    <td>{category.categoryID}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => {
                          setEditingCategory(category);
                          setShowForm(true);
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(category.categoryID, category.name)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryList;
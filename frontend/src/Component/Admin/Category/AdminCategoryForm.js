import React, { useState, useEffect } from 'react';
import CategoryService from '../../../Service/CategoryService';

const AdminCategoryForm = ({ category, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrors({ name: 'Tên danh mục là bắt buộc' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (category) {
        await CategoryService.updateCategory(category.categoryID, formData);
      } else {
        await CategoryService.createCategory(formData);
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {category ? 'Sửa Danh mục' : 'Thêm Danh mục'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-danger">{errors.submit}</div>
              )}

              <div className="mb-3">
                <label className="form-label">Tên Danh mục *</label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Mô tả</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Đang lưu...'
                  : category
                  ? 'Cập nhật'
                  : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryForm;
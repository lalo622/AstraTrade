import axios from "axios";

const API_URL = "http://localhost:5234/api/Admin/Category"; 

const CategoryService = {
  getAllCategories: () => axios.get(API_URL),
  getCategoryById: (id) => axios.get(`${API_URL}/${id}`),
  
  createCategory: async (data) => {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Có lỗi xảy ra khi thêm danh mục');
      }
    }
  },
  
  updateCategory: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Có lỗi xảy ra khi cập nhật danh mục');
      }
    }
  },
  
  deleteCategory: (id) => axios.delete(`${API_URL}/${id}`)
};

export default CategoryService;
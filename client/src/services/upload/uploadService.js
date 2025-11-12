import api from '../api';

const uploadService = {
  uploadProfilePicture: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });

    // response.data should be { path: '/uploads/profile-pictures/..' }
    return response.data;
  }
};

export default uploadService;

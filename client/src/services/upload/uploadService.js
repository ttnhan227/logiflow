import api from '../api';

const uploadService = {
  uploadProfilePicture: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });

      // response.data should be { path: '/uploads/profile-pictures/..' }
      if (!response.data || !response.data.path) {
        throw new Error('Server did not return file path');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadLicenseImage: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads/license-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });

      if (!response.data || !response.data.path) {
        throw new Error('Server did not return file path');
      }

      return response.data; // { path }
    } catch (error) {
      throw error;
    }
  },

  uploadCV: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });

      if (!response.data || !response.data.path) {
        throw new Error('Server did not return file path');
      }

      return response.data; // { path }
    } catch (error) {
      throw error;
    }
  },

  uploadBusinessLicense: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads/business-license', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });

      if (!response.data || !response.data.path) {
        throw new Error('Server did not return file path');
      }

      return response.data; // { path }
    } catch (error) {
      throw error;
    }
  },

  uploadTaxCertificate: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads/tax-certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });

      if (!response.data || !response.data.path) {
        throw new Error('Server did not return file path');
      }

      return response.data; // { path }
    } catch (error) {
      throw error;
    }
  },


};

export default uploadService;

import api from '../api';

const uploadFile = async (endpoint, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

  if (!response.data?.path) {
    throw new Error('Server did not return a file path');
  }

  return response.data;
};

const uploadService = {
  uploadProfilePicture: (file, onUploadProgress) =>
    uploadFile('/uploads/profile-picture', file, onUploadProgress),
  uploadLicenseImage: (file, onUploadProgress) =>
    uploadFile('/uploads/license-image', file, onUploadProgress),
  uploadCV: (file, onUploadProgress) =>
    uploadFile('/uploads/cv', file, onUploadProgress),
  uploadBusinessLicense: (file, onUploadProgress) =>
    uploadFile('/uploads/business-license', file, onUploadProgress),
  uploadTaxCertificate: (file, onUploadProgress) =>
    uploadFile('/uploads/tax-certificate', file, onUploadProgress),
};

export default uploadService;

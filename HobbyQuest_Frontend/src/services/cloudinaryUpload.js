// src/services/cloudinaryUpload.js
const CLOUD_NAME = 'q5lfaeu0';
const UPLOAD_PRESET = 'hobbyquest_uploads';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads a local image URI (from expo-image-picker) to Cloudinary.
 * @param {string} localUri
 * @param {string} [folder] - overrides the preset's default asset folder.
 *   Pass 'hobbyquest/feedback' for bug/suggestion screenshots, or omit to
 *   use the preset default (hobbyquest/communityposts) for community shares.
 */
export async function uploadImageToCloudinary(localUri, folder) {
  const formData = new FormData();

  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  });
  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'Image upload failed. Please try again.';
    throw new Error(message);
  }

  return data.secure_url;
}
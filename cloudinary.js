// --- Cloudinary Configuration ---
// IMPORTANT: You need to replace these with your own Cloudinary details.
// 1. Go to your Cloudinary Dashboard -> Settings -> API Keys
// 2. Find your "Cloud name".
// 3. Go to "Upload" settings -> Upload presets.
// 4. Create a new "Unsigned" upload preset.
// 5. Copy the preset name here.

const CLOUD_NAME = 'dlqo2eyvb'; // <--- REPLACE WITH YOUR CLOUD NAME
const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // <--- REPLACE WITH YOUR UPLOAD PRESET NAME

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads an image file to Cloudinary.
 * @param {File} file The image file to upload.
 * @returns {Promise<string>} The secure URL of the uploaded image.
 */
export async function uploadImage(file) {
    if (!file) throw new Error("No file provided for upload.");
    if (!CLOUD_NAME || CLOUD_NAME === 'YOUR_CLOUD_NAME') {
         throw new Error("Cloudinary is not configured. Please set your Cloud Name and Upload Preset in cloudinary.js.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
        }

        const data = await response.json();
        return data.secure_url; // Return the HTTPS URL of the uploaded image
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw error; // Re-throw the error to be caught by the calling function
    }
}

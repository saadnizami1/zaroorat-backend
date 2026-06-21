const cloudinary = require("./cloudinary");

/**
 * Extract the Cloudinary public_id (including folder) from a stored secure URL.
 * e.g. https://res.cloudinary.com/<cloud>/image/upload/v1700000000/fundraising_app/abc123.jpg
 *      -> fundraising_app/abc123
 * Returns null if the value is not a parseable Cloudinary URL.
 */
const getPublicIdFromUrl = (url) => {
  try {
    if (!url || typeof url !== "string") return null;
    const marker = "/upload/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;

    let path = url.substring(idx + marker.length); // v123/folder/name.jpg
    // Drop a leading version segment like "v1700000000/"
    path = path.replace(/^v\d+\//, "");
    // Drop the file extension
    path = path.replace(/\.[^/.]+$/, "");
    return path || null;
  } catch {
    return null;
  }
};

/**
 * Best-effort delete of a single Cloudinary asset by its stored URL.
 * Never throws — failures are logged so they can't break the request flow.
 */
const deleteCloudinaryImage = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed for", publicId, error.message);
  }
};

/**
 * Delete many images concurrently, best-effort.
 */
const deleteCloudinaryImages = async (urls = []) => {
  await Promise.all(urls.filter(Boolean).map((u) => deleteCloudinaryImage(u)));
};

module.exports = {
  getPublicIdFromUrl,
  deleteCloudinaryImage,
  deleteCloudinaryImages,
};

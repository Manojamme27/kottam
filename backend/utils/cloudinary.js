import cloudinary from "cloudinary";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ NEW: Works with multer.memoryStorage() buffer on Render
const uploadOnCloudinary = async (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: "shops" },       // optional folder
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        // pipe buffer into Cloudinary
        uploadStream.end(fileBuffer);
    });
};

export default uploadOnCloudinary;

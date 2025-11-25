import cloudinary from "cloudinary";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(filePath, { folder: "shops" }, (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
        });
    });
};

export default uploadOnCloudinary;

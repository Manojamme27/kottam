import multer from "multer";

// ✅ Store files in RAM instead of saving to /uploads (Render safe)
const storage = multer.memoryStorage();

export const upload = multer({ storage });

import multer from "multer";

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, "./uploads"); // ✅ same folder served in server.js
   },
   filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname); // unique name
   },
});

export const upload = multer({ storage });

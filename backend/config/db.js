import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.log("❌ MongoDB Connection Failed:", error.message);
    }
};

export default connectDb;

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (mongoURI = process.env.MONGO_URI) => {

    if (!mongoURI) {
        throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB Connected ✅");
};

export const disconnectDB = () => mongoose.disconnect();
export default connectDB;
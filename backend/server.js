import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRouter from "./routers/authRouter.js";
import complaintRouter from "./routers/complaintRouter.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CivicAI Backend is running 🚀"
    });
});
app.use("/api/auth" , authRouter);
app.use("/api/complaints", complaintRouter);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Backend startup failed ❌", error.message);
        process.exitCode = 1;
    }
};

startServer();
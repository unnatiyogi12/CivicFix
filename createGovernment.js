import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import connectDB, { disconnectDB } from "./backend/config/db.js";
import User from "./backend/models/User.js";

dotenv.config({ path: fileURLToPath(new URL("./backend/.env", import.meta.url)) });

const MONGO_URI = process.env.MONGO_URI;

const createGovernmentUser = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not found in backend/.env");
    }

    console.log("🔄 Connecting to MongoDB...");

    await connectDB(MONGO_URI);

    console.log("✅ MongoDB connected");

    const email = "government@civicfix.com";
    const password = "government123";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("⚠️ Government user already exists");
      console.log(`Email: ${email}`);
      console.log(`Role: ${existingUser.role}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const governmentUser = await User.create({
      name: "CivicFix Government",
      email,
      password: hashedPassword,
      role: "government",
      phone: "",
      department: "",
      isActive: true,
    });

    console.log("====================================");
    console.log("✅ Government user created successfully");
    console.log("====================================");
    console.log(`Email    : ${governmentUser.email}`);
    console.log(`Password : ${password}`);
    console.log(`Role     : ${governmentUser.role}`);
    console.log("====================================");
  } catch (error) {
    console.error("❌ Error creating government user:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

createGovernmentUser();
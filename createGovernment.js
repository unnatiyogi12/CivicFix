import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./backend/models/User.js";

dotenv.config({ path: "./backend/.env" });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in backend/.env");
  process.exit(1);
}

const createGovernmentUser = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");

    const email = "government@civicfix.com";
    const password = "government123";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("⚠️ Government user already exists");
      console.log(`Email: ${email}`);
      console.log(`Role: ${existingUser.role}`);

      await mongoose.connection.close();
      process.exit(0);
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

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating government user:");
    console.error(error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

createGovernmentUser();
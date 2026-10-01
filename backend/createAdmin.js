import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const adminEmail = "admin@civicfix.com";
    const adminPassword = "admin123";
    const adminName = "CivicFix Admin";

    const existingAdmin = await User.findOne({
      email: adminEmail
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      10
    );

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin"
    });

    console.log("Admin created successfully!");
    console.log("Email:", admin.email);
    console.log("Password:", adminPassword);
    console.log("Role:", admin.role);

    process.exit(0);

  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
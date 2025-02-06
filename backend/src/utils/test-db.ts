import mongoose from "mongoose";
import userModel from "../models/user";
import { DATABASE } from "../config";

const testDB = async () => {
    try {
        console.log("🛠 Connecting to MongoDB...");
        await mongoose.connect(DATABASE!);
        console.log("✅ Connected Successfully!");

        const testUser = new userModel({
            firstname: "Test",
            lastname: "User",
            email: "testuser@gmail.com",
            phone_number: "1234567890",
            password: "Test@123!",
            gender: "male"
        });

        console.log("💾 Saving test user...");
        await testUser.save();
        console.log("✅ Test user saved successfully!");

        mongoose.connection.close();
    } catch (err) {
        console.error("❌ Error:", err);
    }
};

testDB();

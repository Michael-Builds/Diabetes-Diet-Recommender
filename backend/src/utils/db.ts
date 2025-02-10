import mongoose from "mongoose";
import colors from 'colors';
import { DATABASE } from "../config";
import { loadCsvDataToMongoDB } from "./loadData";


const connectDB = async () => {
    try {
        if (!DATABASE) {
            throw new Error("Database connection string is not defined");
        }
        await mongoose.connect(DATABASE).then((data: any) => {
            console.log(colors.bgGreen.white('Database Connected Successfully!'));
            loadCsvDataToMongoDB()
        });
    } catch (error: any) {
        console.log(colors.bgRed.white(`Error Connecting to Database: ${error.message}`));
    }
}

export default connectDB;
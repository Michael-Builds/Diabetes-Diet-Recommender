import { v2 as cloudinary } from "cloudinary";
import colors from 'colors';
import { app } from "./app";
import { CLOUD_API_KEY, CLOUD_NAME, CLOUD_SECRET_KEY, NODE_ENV, PORT } from "./config";
import connectDB from "./utils/db";

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_SECRET_KEY
})

app.listen(PORT || 4000, () => {
    console.log(colors.bgCyan.white(`Server running in ${NODE_ENV} mode on port ${PORT}`))
    connectDB();
});


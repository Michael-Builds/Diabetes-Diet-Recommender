import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import colors from "colors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { SWAGGER_PORT } from "./config";
import { ErrorMiddleware } from "./middlewares/error";
import userRouter from "./routes/user";

export const app = express();
export const ORIGIN = ["http://localhost:5173", "http://localhost:5174"];

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(
    cors({
        origin: ORIGIN,
        // methods: "GET,POST,PUT,DELETE,OPTIONS",
        allowedHeaders: "Content-Type,Authorization",
        credentials: true,
    })
);

app.use("/api", userRouter);

const swaggerPath = path.resolve(process.cwd(), "src/config/swagger-output.json");

if (fs.existsSync(swaggerPath)) {
    const swaggerFile = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

    console.log(colors.bgCyan.white(`📄Swagger Docs available at http://localhost:${SWAGGER_PORT}/api-docs`));
} else {
    console.error(colors.bgRed.white("❌Swagger file not found! Run `npm run swagger` first."));
}

app.listen(SWAGGER_PORT, () => {
    console.log(colors.bgYellow.white(`🚀 Swagger Server running on port ${SWAGGER_PORT}`));
});

app.all("*", (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
//
app.use(ErrorMiddleware);

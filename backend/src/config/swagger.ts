import swaggerAutogen from "swagger-autogen";
import fs from "fs";

const protectedRoutes = [
    "/logout",
    "/get-user",
    "/notifications",
    "/update-notification-status/{id}",
    "/update-profile",
    "/update-health-details",
    "/update-customizations",
    "/generate-recommendations/:userId",
    "/get-recommendations/:userId",
];

const doc = {
    info: {
        title: "Diet Recommender API",
        description: "API documentation automatically generated",
        version: "1.0.0",
    },
    host: "localhost:4000",
    basePath: "/api",
    schemes: ["http"],
    securityDefinitions: {
        BearerAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "Enter your bearer token in the format 'Bearer {token}'"
        }
    },
    paths: {}
};

const outputFile = "./src/config/swagger-output.json";
const endpointsFiles = ["./src/routes/user.ts"];

// Run Swagger Autogen
swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
    console.log("✅ Swagger JSON Generated Successfully!");
    try {
        const swaggerData = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

        // Dynamically update security for protected routes
        protectedRoutes.forEach(route => {
            if (swaggerData.paths[route]) {
                Object.keys(swaggerData.paths[route]).forEach(method => {
                    swaggerData.paths[route][method].security = [{ BearerAuth: [] }];
                });
            }
        });

        // Save the modified Swagger JSON
        fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
    } catch (error) {
        console.error("❌ Error updating Swagger JSON:", error);
    }
});

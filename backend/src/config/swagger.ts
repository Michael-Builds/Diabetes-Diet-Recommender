import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "Diet Recommender API",
        description: "API documentation automatically generated",
        version: "1.0.0",
    },
    host: "localhost:4000",
    basePath: "/api", 
    schemes: ["http"],
};


const outputFile = "./src/config/swagger-output.json";
const endpointsFiles = ["./src/routes/user.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
    console.log("✅ Swagger JSON Generated Successfully!");
});

import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiz Game API",
      version: "1.0.0",
      description: "A simple Express Quiz Game API",
    },
    servers: [
      {
        url: "https://quiz-be-zeta.vercel.app/",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

export default (app) => {
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; " +
        "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com"
    );
    next();
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

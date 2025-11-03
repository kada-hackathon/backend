// swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WorkLog API Documentation",
      version: "1.0.0",
      description:
        "API documentation for WorkLog Management System (Auth, Admin, WorkLogs, Versions, Collaborators)",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Server",
      },
    ],
    components: {
      schemas: {
        LogHistory: {
          type: "object",
          required: ["message", "datetime", "user"],
          properties: {
            _id: {
              type: "string",
              description: "Unique ID of the log entry",
              example: "671b1f3f2c8d7b8a8c4b1234"
            },
            message: {
              type: "string",
              description: "Description of the work log change",
              example: "User updated the content"
            },
            datetime: {
              type: "string",
              format: "date-time",
              description: "Time when this log entry was created",
              example: "2025-10-27T12:30:00.000Z"
            },
            user: {
              type: "string",
              description: "ID of the user who made the change",
              example: "671b1a2f9b8d8b9a8c4b5678"
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    "./src/swagger/*.js",
    "./src/routes/*.js"
],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;

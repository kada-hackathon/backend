// swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NEBWORK API Documentation",
      version: "2.0.0",
      description:
        "Complete API documentation for NEBWORK Management System including Authentication, WorkLogs, Chatbot, File Upload, Admin, and Version Control",
      contact: {
        name: "NEBWORK Team",
        email: "support@nebwork.com"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "671b1a2f9b8d8b9a8c4b5678"
            },
            name: {
              type: "string",
              example: "John Doe"
            },
            email: {
              type: "string",
              example: "john@example.com"
            },
            profile_photo: {
              type: "string",
              example: "https://example.com/avatar.jpg"
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              example: "user"
            }
          }
        },
        WorkLog: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "671b1f3f2c8d7b8a8c4b1234"
            },
            title: {
              type: "string",
              example: "Project Update"
            },
            content: {
              type: "string",
              example: "<p>Work completed today...</p>"
            },
            tag: {
              type: "array",
              items: {
                type: "string"
              },
              example: ["development", "frontend"]
            },
            author: {
              type: "string",
              example: "671b1a2f9b8d8b9a8c4b5678"
            },
            collaborators: {
              type: "array",
              items: {
                type: "string"
              }
            },
            created_at: {
              type: "string",
              format: "date-time"
            },
            updated_at: {
              type: "string",
              format: "date-time"
            }
          }
        },
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
        },
        ChatMessage: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1699876543211"
            },
            text: {
              type: "string",
              example: "How do I create a worklog?"
            },
            sender: {
              type: "string",
              enum: ["user", "bot"],
              example: "user"
            },
            timestamp: {
              type: "string",
              format: "date-time"
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            message: {
              type: "string",
              example: "Error message"
            },
            error: {
              type: "string",
              example: "Detailed error description"
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token in format: Bearer {token}"
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: "Authentication",
        description: "User authentication endpoints (Register, Login, Profile, Password Reset)"
      },
      {
        name: "WorkLogs",
        description: "WorkLog CRUD operations and version management"
      },
      {
        name: "Chatbot",
        description: "AI-powered chatbot for assistance"
      },
      {
        name: "Upload",
        description: "File upload and management (Images, Videos, Documents)"
      },
      {
        name: "Admin",
        description: "Admin operations for user management (Admin only)"
      }
    ],
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

/**
 * @swagger
 * tags:
 *   name: WorkLogs
 *   description: API endpoints for managing work logs, versions, and collaborators
 */

/**
 * @swagger
 * /api/worklogs:
 *   post:
 *     summary: Create a new work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Design System Update
 *               content:
 *                 type: string
 *                 example: Updated the color palette and spacing system
 *               tag:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["UI", "Design"]
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["screenshot1.png"]
 *     responses:
 *       201:
 *         description: Work log created successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/worklogs/{id}:
 *   put:
 *     summary: Edit a work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Work log ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: Updated Log Title
 *               content: Edited the design section
 *     responses:
 *       200:
 *         description: Work log updated successfully
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/worklogs/{id}:
 *   delete:
 *     summary: Delete a work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Work log ID
 *     responses:
 *       200:
 *         description: Work log deleted successfully
 *       403:
 *         description: Not allowed to delete
 *       404:
 *         description: WorkLog not found
 */

/**
 * @swagger
 * /api/worklogs/{id}/versions:
 *   post:
 *     summary: Add a new version (log history) to a specific work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Work Log
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Description of the update or version change
 *                 example: "Added section for responsive layout"
 *     responses:
 *       201:
 *         description: Version added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogHistory'
 *       404:
 *         description: Work Log not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/worklogs/{id}/versions:
 *   get:
 *     summary: Get all log history (versions) for a specific work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the Work Log
 *     responses:
 *       200:
 *         description: Successfully retrieved log history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LogHistory'
 *       403:
 *         description: Not allowed to view versions
 *       404:
 *         description: Work Log not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/worklogs/{id}/collaborators:
 *   post:
 *     summary: Add a collaborator to a work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work log ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: collaborator@gmail.com
 *     responses:
 *       200:
 *         description: Collaborator added successfully
 *       404:
 *         description: Work log or user not found
 */

/**
 * @swagger
 * /api/worklogs/{id}/collaborators:
 *   get:
 *     summary: Get collaborators of a work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Work log ID
 *     responses:
 *       200:
 *         description: Successfully retrieved collaborators
 */

/**
 * @swagger
 * /api/worklogs/{id}/collaborators/{collaboratorId}:
 *   delete:
 *     summary: Remove a collaborator from a work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /api/worklogs/filter:
 *   get:
 *     summary: Search and filter work logs (division-aware)
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retrieve work logs based on search criteria and filters.
 *       Returns only work logs from the same division as the authenticated user.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or content (case-insensitive)
 *         example: "AI Development"
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated or single tag). Matches any tag.
 *         example: "nodejs,react"
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter (YYYY-MM-DD)
 *         example: "2024-10-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter (YYYY-MM-DD)
 *         example: "2024-10-31"
 *     responses:
 *       200:
 *         description: Successfully retrieved filtered work logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 worklogs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       tag:
 *                         type: array
 *                         items:
 *                           type: string
 *                       user:
 *                         type: object
 *                       datetime:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/worklogs/{id}:
 *   get:
 *     summary: Get a specific work log by ID
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work log ID
 *         example: "671b1f3f2c8d7b8a8c4b1234"
 *     responses:
 *       200:
 *         description: Successfully retrieved work log
 *       404:
 *         description: Work log not found
 *       401:
 *         description: Unauthorized
 */

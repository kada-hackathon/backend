/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API untuk login, logout, reset password, dan profil user
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 64b25ff43c99d68dca99a3a5
 *         email:
 *           type: string
 *           example: johndoe@gmail.com
 *         name:
 *           type: string
 *           example: John Doe
 *         division:
 *           type: string
 *           example: Engineering
 *         role:
 *           type: string
 *           enum: [admin, user]
 *           example: user
 *         profile_photo:
 *           type: string
 *           example: https://example.com/uploads/profile.jpg
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user dengan email dan password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Email atau password kosong / domain tidak diizinkan
 *       401:
 *         description: Email atau password salah
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (hapus token dari cookie)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successfully
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Kirim link reset password ke email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *     responses:
 *       200:
 *         description: Email reset password dikirim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email sent successfully
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Gagal mengirim email
 */

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Ambil profil user yang sedang login
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Tidak ada token / user tidak terautentikasi
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Internal server error
 */

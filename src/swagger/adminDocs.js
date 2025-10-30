/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: API untuk manajemen data pegawai (hanya untuk admin)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
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
 *         join_date:
 *           type: string
 *           format: date-time
 *           example: 2025-10-27T09:00:00.000Z
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 35
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         pages:
 *           type: integer
 *           example: 4
 */

/**
 * @swagger
 * /api/admin/employees:
 *   post:
 *     summary: Tambah data pegawai baru
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - division
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               division:
 *                 type: string
 *                 example: Engineering
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: user
 *     responses:
 *       201:
 *         description: Pegawai berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Employee added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Input tidak valid atau user sudah ada
 *       500:
 *         description: Gagal menambah pegawai
 */

/**
 * @swagger
 * /api/admin/employees/{id}:
 *   put:
 *     summary: Edit data pegawai berdasarkan ID
 *     tags: [Admin]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID pegawai yang akan diubah
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b25ff43c99d68dca99a3a5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@yahoo.com
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               division:
 *                 type: string
 *                 example: Product
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: admin
 *               join_date:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-15
 *     responses:
 *       200:
 *         description: Pegawai berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Employee updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Pegawai tidak ditemukan
 *       400:
 *         description: Domain email tidak valid
 *       500:
 *         description: Gagal memperbarui pegawai
 */

/**
 * @swagger
 * /api/admin/employees/{id}:
 *   delete:
 *     summary: Hapus pegawai berdasarkan ID
 *     tags: [Admin]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID pegawai yang akan dihapus
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b25ff43c99d68dca99a3a5
 *     responses:
 *       200:
 *         description: Pegawai berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Employee deleted successfully
 *       404:
 *         description: Pegawai tidak ditemukan
 *       500:
 *         description: Gagal menghapus pegawai
 */

/**
 * @swagger
 * /api/admin/employees:
 *   get:
 *     summary: Ambil daftar semua pegawai dengan pagination
 *     tags: [Admin]
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Nomor halaman (default = 1)
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Jumlah data per halaman (default = 10)
 *     responses:
 *       200:
 *         description: Daftar pegawai berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Employees retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Gagal mengambil data pegawai
 */

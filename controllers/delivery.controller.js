const Validator = require('fastest-validator')
const v = new Validator()
const { DeliveryOrder, OrderItem, Menu, User } = require('../models')
const { response } = require('../helpers/response.formatter')
const PDFDocument = require('pdfkit')

module.exports = {
    // Customer: Buat delivery order
    createOrder: async (req, res) => {
        try {
            const { delivery_address, notes, items } = req.body

            const schema = {
                delivery_address: { type: 'string', min: 5 },
                notes: { type: 'string', optional: true },
                items: { type: 'array', min: 1 }
            }
            const data = {
                delivery_address,
                notes: notes || '',
                items: items || []
            }
            const validate = v.validate(data, schema)
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'Validasi Error', validate))
            }

            let totalPrice = 0
            const orderItemsData = []

            for (const item of data.items) {
                const menu = await Menu.findByPk(item.menu_id)
                if (!menu) {
                    return res.status(400).json(response(400, 'Validasi Error', `Menu ID ${item.menu_id} tidak ditemukan`))
                }
                if (!menu.is_available) {
                    return res.status(400).json(response(400, 'Validasi Error', `Menu ${menu.name} tidak tersedia`))
                }
                const subtotal = menu.price * item.quantity
                totalPrice += parseFloat(subtotal)
                orderItemsData.push({
                    menu_id: item.menu_id,
                    quantity: item.quantity,
                    price_each: menu.price,
                    subtotal
                })
            }

            const db = require('../models')
            const result = await db.sequelize.transaction(async (t) => {
                const order = await DeliveryOrder.create({
                    user_id: req.user.userId,
                    driver_id: null,
                    delivery_address: data.delivery_address,
                    total_price: totalPrice,
                    notes: data.notes,
                    status: 'pending'
                }, { transaction: t })

                const itemsWithOrderId = orderItemsData.map(item => ({
                    ...item,
                    order_id: order.id
                }))
                await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t })

                return order
            })

            const fullOrder = await DeliveryOrder.findByPk(result.id, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone'] },
                    { model: OrderItem, include: [{ model: Menu, attributes: ['id', 'name', 'price'] }] }
                ]
            })
            return res.status(201).json(response(201, 'Order berhasil dibuat', fullOrder))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Get orders (filter by role)
    getOrders: async (req, res) => {
        try {
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 10
            const offset = (page - 1) * limit
            const { status } = req.query

            const whereClause = {}
            if (req.user.role === 'customer') {
                whereClause.user_id = req.user.userId
            }
            if (req.user.role === 'driver') {
                whereClause.driver_id = req.user.userId
            }
            if (status) whereClause.status = status

            const { count, rows } = await DeliveryOrder.findAndCountAll({
                where: whereClause,
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
                    { model: OrderItem, include: [{ model: Menu, attributes: ['id', 'name', 'price'] }] }
                ],
                order: [['createdAt', 'DESC']],
                offset,
                limit
            })

            const formatPagination = {
                data: rows,
                limit,
                currentPage: page,
                totalPage: Math.ceil(count / limit),
                total: count
            }
            return res.status(200).json(response(200, 'Success', formatPagination))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Detail order
    detailOrder: async (req, res) => {
        try {
            const { id } = req.params
            const order = await DeliveryOrder.findByPk(id, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'address'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
                    { model: OrderItem, include: [{ model: Menu }] }
                ]
            })
            if (!order) {
                return res.status(404).json(response(404, 'Order tidak ditemukan'))
            }
            return res.status(200).json(response(200, 'Success', order))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Admin update status (umum)
    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params
            const { status, driver_id } = req.body

            const allowedStatus = ['pending', 'confirmed', 'preparing', 'on_delivery', 'delivered', 'cancelled']
            if (!allowedStatus.includes(status)) {
                return res.status(400).json(response(400, 'Validasi Error', 'Status tidak valid'))
            }

            const order = await DeliveryOrder.findByPk(id)
            if (!order) {
                return res.status(404).json(response(404, 'Order tidak ditemukan'))
            }

            const updateData = { status }
            if (driver_id && req.user.role === 'admin') {
                const driver = await User.findOne({ where: { id: driver_id, role: 'driver' } })
                if (!driver) {
                    return res.status(400).json(response(400, 'Validasi Error', 'Driver tidak ditemukan'))
                }
                updateData.driver_id = driver_id
            }

            await DeliveryOrder.update(updateData, { where: { id } })
            const updated = await DeliveryOrder.findByPk(id, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
                    { model: OrderItem, include: [{ model: Menu, attributes: ['id', 'name', 'price'] }] }
                ]
            })
            return res.status(200).json(response(200, 'Status order diperbarui', updated))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Admin assign driver ke order
    assignDriver: async (req, res) => {
        try {
            const { id } = req.params
            const { driver_id } = req.body

            if (!driver_id) {
                return res.status(400).json(response(400, 'Validasi Error', 'Driver ID tidak boleh kosong'))
            }

            const order = await DeliveryOrder.findByPk(id)
            if (!order) {
                return res.status(404).json(response(404, 'Order tidak ditemukan'))
            }

            if (order.status !== 'pending') {
                return res.status(400).json(response(400, 'Validasi Error', 'Order sudah diproses, tidak bisa assign driver'))
            }

            const driver = await User.findOne({ where: { id: driver_id, role: 'driver' } })
            if (!driver) {
                return res.status(400).json(response(400, 'Validasi Error', 'Driver tidak ditemukan'))
            }

            await DeliveryOrder.update(
                { driver_id: driver_id, status: 'confirmed' },
                { where: { id } }
            )

            const updated = await DeliveryOrder.findByPk(id, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'address'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
                    { model: OrderItem, include: [{ model: Menu, attributes: ['id', 'name', 'price'] }] }
                ]
            })

            return res.status(200).json(response(200, 'Driver berhasil ditugaskan', updated))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Driver mengambil order
    takeOrder: async (req, res) => {
        try {
            const { id } = req.params

            const order = await DeliveryOrder.findByPk(id)
            if (!order) {
                return res.status(404).json(response(404, 'Order tidak ditemukan'))
            }

            if (order.driver_id !== req.user.userId) {
                return res.status(403).json(response(403, 'Forbidden', 'Order ini bukan untuk Anda'))
            }

            if (order.status !== 'confirmed') {
                return res.status(400).json(response(400, 'Validasi Error', 'Order tidak bisa diambil'))
            }

            await DeliveryOrder.update(
                { status: 'on_delivery' },
                { where: { id } }
            )

            const updated = await DeliveryOrder.findByPk(id, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'address'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
                    { model: OrderItem, include: [{ model: Menu }] }
                ]
            })

            return res.status(200).json(response(200, 'Order diambil, sedang dalam pengiriman', updated))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Driver menyelesaikan pengiriman
    completeDelivery: async (req, res) => {
        try {
            const { id } = req.params

            const order = await DeliveryOrder.findByPk(id)
            if (!order) {
                return res.status(404).json(response(404, 'Order tidak ditemukan'))
            }

            if (order.driver_id !== req.user.userId) {
                return res.status(403).json(response(403, 'Forbidden', 'Order ini bukan untuk Anda'))
            }

            if (order.status !== 'on_delivery') {
                return res.status(400).json(response(400, 'Validasi Error', 'Order tidak bisa diselesaikan'))
            }

            await DeliveryOrder.update(
                { status: 'delivered' },
                { where: { id } }
            )

            const updated = await DeliveryOrder.findByPk(id, {
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'phone'] },
                    { model: OrderItem, include: [{ model: Menu }] }
                ]
            })

            return res.status(200).json(response(200, 'Pengiriman selesai', updated))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Get orders untuk driver (hanya yang ditugaskan)
    getMyDeliveries: async (req, res) => {
        try {
            const orders = await DeliveryOrder.findAll({
                where: { driver_id: req.user.userId },
                include: [
                    { model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'address'] },
                    { model: OrderItem, include: [{ model: Menu, attributes: ['id', 'name', 'price'] }] }
                ],
                order: [['createdAt', 'DESC']]
            })

            return res.status(200).json(response(200, 'Success', orders))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    // Get all drivers (untuk admin assign)
    getAllDrivers: async (req, res) => {
    try {
        const drivers = await User.findAll({
            where: { role: 'driver' },
            attributes: ['id', 'name', 'username', 'phone']
        })
        return res.status(200).json(response(200, 'Success', drivers))
    } catch (error) {
        return res.status(500).json(response(500, 'Server Error', error.message))
    }
},

    // Export PDF
    exportOrdersPdf: async (req, res) => {
        try {
            const orders = await DeliveryOrder.findAll({
                include: [
                    { model: User, as: 'customer', attributes: ['name', 'phone'] },
                    { model: User, as: 'driver', attributes: ['name'] },
                    { model: OrderItem, include: [{ model: Menu, attributes: ['name'] }] }
                ],
                order: [['createdAt', 'DESC']]
            })

            const doc = new PDFDocument({ margin: 30 })
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'attachment; filename=delivery.pdf')
            doc.pipe(res)

            doc.fontSize(18).text('Laporan Delivery Order Restoran', { align: 'center' })
            doc.moveDown()
            doc.fontSize(10)

            orders.forEach((o, i) => {
                doc.text(`${i + 1}. ${o.customer?.name} | Total: Rp${Number(o.total_price).toLocaleString('id-ID')} | Status: ${o.status}`)
                doc.text(`   Alamat: ${o.delivery_address}`)
                doc.text(`   Driver: ${o.driver?.name || 'Belum ditugaskan'}`)
                const itemList = o.OrderItems?.map(oi => `${oi.Menu?.name} x${oi.quantity}`).join(', ')
                doc.text(`   Item: ${itemList}`)
                doc.moveDown(0.5)
            })

            doc.end()
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    }
}
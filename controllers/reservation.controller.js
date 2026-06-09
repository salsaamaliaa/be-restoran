const Validator = require('fastest-validator')
const v = new Validator()
const { Reservation, Table, User } = require('../models')
const { response } = require('../helpers/response.formatter')
const { Op } = require('sequelize')
const PDFDocument = require('pdfkit')

module.exports = {
    createReservation: async (req, res) => {
        try {
            const { table_id, reservation_date, guest_count, notes } = req.body

            const schema = {
                table_id: { type: 'number', positive: true, integer: true },
                reservation_date: { type: 'string' },
                guest_count: { type: 'number', positive: true, integer: true },
                notes: { type: 'string', optional: true }
            }
            const data = {
                table_id: Number(table_id),
                reservation_date,
                guest_count: Number(guest_count),
                notes: notes || ''
            }
            const validate = v.validate(data, schema)
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'Validasi Error', validate))
            }

            // cek ketersediaan meja
            const table = await Table.findByPk(data.table_id)
            if (!table) {
                return res.status(400).json(response(400, 'Validasi Error', 'Meja tidak ditemukan'))
            }
            if (table.capacity < data.guest_count) {
                return res.status(400).json(response(400, 'Validasi Error', `Kapasitas meja hanya ${table.capacity} orang`))
            }

            // cek apakah meja sudah dipesan di waktu yang sama
            const reserveDate = new Date(data.reservation_date)
            const startTime = new Date(reserveDate.getTime() - 2 * 60 * 60 * 1000) // -2 jam
            const endTime = new Date(reserveDate.getTime() + 2 * 60 * 60 * 1000) // +2 jam

            const conflictReservation = await Reservation.findOne({
                where: {
                    table_id: data.table_id,
                    reservation_date: { [Op.between]: [startTime, endTime] },
                    status: { [Op.in]: ['pending', 'confirmed'] }
                }
            })
            if (conflictReservation) {
                return res.status(400).json(response(400, 'Validasi Error', 'Meja sudah dipesan di waktu tersebut'))
            }

            // DATABASE TRANSACTION: buat reservasi dan update status meja sekaligus
            const db = require('../models')
            const result = await db.sequelize.transaction(async (t) => {
                const reservation = await Reservation.create({
                    user_id: req.user.userId,
                    table_id: data.table_id,
                    reservation_date: new Date(data.reservation_date),
                    guest_count: data.guest_count,
                    notes: data.notes,
                    status: 'pending'
                }, { transaction: t })

                await Table.update(
                    { status: 'reserved' },
                    { where: { id: data.table_id }, transaction: t }
                )

                return reservation
            })

            const fullReservation = await Reservation.findByPk(result.id, {
                include: [
                    { model: User, attributes: ['id', 'name', 'username', 'phone'] },
                    { model: Table }
                ]
            })
            return res.status(201).json(response(201, 'Reservasi berhasil dibuat', fullReservation))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    getReservations: async (req, res) => {
        try {
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 10
            const offset = (page - 1) * limit
            const { status } = req.query

            const whereClause = {}
            // customer hanya bisa lihat reservasi sendiri
            if (req.user.role === 'customer') {
                whereClause.user_id = req.user.userId
            }
            if (status) whereClause.status = status

            const { count, rows } = await Reservation.findAndCountAll({
                where: whereClause,
                include: [
                    { model: User, attributes: ['id', 'name', 'phone'] },
                    { model: Table }
                ],
                order: [['reservation_date', 'DESC']],
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

    updateReservationStatus: async (req, res) => {
        try {
            const { id } = req.params
            const { status } = req.body

            const allowedStatus = ['pending', 'confirmed', 'cancelled', 'completed']
            if (!allowedStatus.includes(status)) {
                return res.status(400).json(response(400, 'Validasi Error', 'Status tidak valid'))
            }

            const reservation = await Reservation.findByPk(id)
            if (!reservation) {
                return res.status(404).json(response(404, 'Reservasi tidak ditemukan'))
            }

            // DATABASE TRANSACTION: update status reservasi dan meja sekaligus
            const db = require('../models')
            await db.sequelize.transaction(async (t) => {
                await Reservation.update({ status }, { where: { id }, transaction: t })

                // update status meja berdasarkan status reservasi
                let tableStatus = 'available'
                if (status === 'confirmed') tableStatus = 'reserved'
                if (status === 'completed' || status === 'cancelled') tableStatus = 'available'

                await Table.update(
                    { status: tableStatus },
                    { where: { id: reservation.table_id }, transaction: t }
                )
            })

            const updated = await Reservation.findByPk(id, {
                include: [
                    { model: User, attributes: ['id', 'name', 'phone'] },
                    { model: Table }
                ]
            })
            return res.status(200).json(response(200, 'Status reservasi diperbarui', updated))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    exportReservationsPdf: async (req, res) => {
        try {
            const reservations = await Reservation.findAll({
                include: [
                    { model: User, attributes: ['name', 'phone'] },
                    { model: Table, attributes: ['table_number', 'capacity'] }
                ],
                order: [['reservation_date', 'DESC']]
            })

            const doc = new PDFDocument({ margin: 30 })
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'attachment; filename=reservations.pdf')
            doc.pipe(res)

            doc.fontSize(18).text('Laporan Reservasi Restoran', { align: 'center' })
            doc.moveDown()
            doc.fontSize(10)

            reservations.forEach((r, i) => {
                doc.text(`${i + 1}. ${r.User?.name} | Meja: ${r.Table?.table_number} | Tamu: ${r.guest_count} | Status: ${r.status}`)
                doc.text(`   Tanggal: ${new Date(r.reservation_date).toLocaleString('id-ID')}`)
                if (r.notes) doc.text(`   Catatan: ${r.notes}`)
                doc.moveDown(0.5)
            })

            doc.end()
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    }
}
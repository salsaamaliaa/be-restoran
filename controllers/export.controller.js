const PDFDocument = require('pdfkit')
const { Pesanan, User, Menu } = require('../models')

module.exports = {

    exportPDF: async (req, res) => {
        try {
            const data = await Pesanan.findAll({
                include: [
                    { model: User, attributes: ['name'] },
                    { model: Menu, attributes: ['price'] }
                ]
            })

            const doc = new PDFDocument()

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'attachment; filename=pesanan.pdf')

            doc.pipe(res)
            doc.fontSize(18).text('Laporan Pesanan', { align: 'center' })
            doc.moveDown()

            data.forEach(item => {
                doc.text(`ID: ${item.id}`)
                doc.text(`Customer: ${item.User ? item.User.name : 'Unknown'}`)
                doc.text(`Menu Price: ${item.Menu ? item.Menu.price : 0}`)
                doc.text(`Meja: ${item.nomor_meja || '-'}`)
                doc.text(`Status: ${item.status}`)
                doc.moveDown()
            })

            doc.end()
        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    }

}
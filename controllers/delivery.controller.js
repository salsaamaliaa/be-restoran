const Validator = require("fastest-validator");
const v = new Validator();
const { DeliveryOrder, OrderItem, Menu, User } = require("../models");
const { response } = require("../helpers/response.formatter");

module.exports = {
  // Get all delivery orders (admin)
  getOrders: async (req, res) => {
    try {
      const orders = await DeliveryOrder.findAll({
        include: [
          { model: User, as: "customer", attributes: ["id", "name", "phone"] },
          { model: User, as: "driver", attributes: ["id", "name", "phone"] },
          {
            model: OrderItem,
            include: [{ model: Menu, attributes: ["id", "name", "price"] }],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return res.status(200).json(response(200, "Success", orders));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  // Get all drivers (admin)
  getAllDrivers: async (req, res) => {
    try {
      const drivers = await User.findAll({
        where: { role: "driver" },
        attributes: ["id", "name", "username", "phone"],
      });
      return res.status(200).json(response(200, "Success", drivers));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  // Assign driver to order (admin)
  assignDriver: async (req, res) => {
    try {
      const { id } = req.params;
      const { driver_id } = req.body;

      const orderId = Number(id);
      const driverId = Number(driver_id);

      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json(response(400, "Order ID tidak valid"));
      }

      if (!Number.isInteger(driverId) || driverId <= 0) {
        return res.status(400).json(response(400, "Driver ID tidak valid"));
      }

      const order = await DeliveryOrder.findByPk(id);
      if (!order) {
        return res.status(404).json(response(404, "Order tidak ditemukan"));
      }

      if (order.status !== "pending") {
        return res
          .status(400)
          .json(
            response(400, "Order sudah diproses, tidak bisa assign driver"),
          );
      }

      const driver = await User.findOne({
        where: { id: driver_id, role: "driver" },
      });
      if (!driver) {
        return res.status(400).json(response(400, "Driver tidak ditemukan"));
      }

      await DeliveryOrder.update(
        { driver_id: driver_id, status: "confirmed" },
        { where: { id } },
      );

      const updated = await DeliveryOrder.findByPk(id, {
        include: [
          { model: User, as: "customer", attributes: ["id", "name", "phone"] },
          { model: User, as: "driver", attributes: ["id", "name", "phone"] },
          { model: OrderItem, include: [{ model: Menu }] },
        ],
      });

      return res
        .status(200)
        .json(response(200, "Driver berhasil ditugaskan", updated));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  // Update order status (admin)
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatus = [
        "pending",
        "confirmed",
        "preparing",
        "on_delivery",
        "delivered",
        "cancelled",
      ];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json(response(400, "Status tidak valid"));
      }

      const order = await DeliveryOrder.findByPk(id);
      if (!order) {
        return res.status(404).json(response(404, "Order tidak ditemukan"));
      }

      await DeliveryOrder.update({ status }, { where: { id } });

      const updated = await DeliveryOrder.findByPk(id, {
        include: [
          { model: User, as: "customer", attributes: ["id", "name", "phone"] },
          { model: User, as: "driver", attributes: ["id", "name", "phone"] },
        ],
      });

      return res
        .status(200)
        .json(response(200, "Status order diperbarui", updated));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  // Create delivery order (customer)
  createOrder: async (req, res) => {
    try {
      const { delivery_address, notes, items } = req.body;

      let totalPrice = 0;
      const orderItemsData = [];

      for (const item of items) {
        const menu = await Menu.findByPk(item.menu_id);
        if (!menu) {
          return res
            .status(400)
            .json(response(400, `Menu ID ${item.menu_id} tidak ditemukan`));
        }
        const subtotal = menu.price * item.quantity;
        totalPrice += parseFloat(subtotal);
        orderItemsData.push({
          menu_id: item.menu_id,
          quantity: item.quantity,
          price_each: menu.price,
          subtotal,
        });
      }

      const order = await DeliveryOrder.create({
        user_id: req.user.userId,
        driver_id: null,
        delivery_address,
        total_price: totalPrice,
        notes: notes || "",
        status: "pending",
      });

      const itemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        order_id: order.id,
      }));
      await OrderItem.bulkCreate(itemsWithOrderId);

      const fullOrder = await DeliveryOrder.findByPk(order.id, {
        include: [
          { model: User, as: "customer", attributes: ["id", "name", "phone"] },
          { model: OrderItem, include: [{ model: Menu }] },
        ],
      });

      return res
        .status(201)
        .json(response(201, "Order berhasil dibuat", fullOrder));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  exportDeliveryPdf: async (req, res) => {
    try {
      const PDFDocument = require("pdfkit");
      const { DeliveryOrder, OrderItem, Menu, User } = require("../models");

      const whereClause =
        req.user.role === "admin" ? {} : { user_id: req.user.userId };
      const orders = await DeliveryOrder.findAll({
        where: whereClause,
        include: [
          { model: User, as: "customer", attributes: ["id", "name"] },
          { model: User, as: "driver", attributes: ["id", "name"] },
          {
            model: OrderItem,
            include: [{ model: Menu, attributes: ["name"] }],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const doc = new PDFDocument({ margin: 30 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=laporan_delivery.pdf",
      );
      doc.pipe(res);

      doc.fontSize(18).text("LAPORAN DELIVERY ORDER", { align: "center" });
      doc
        .fontSize(10)
        .text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, {
          align: "center",
        });
      doc.moveDown();

      let y = doc.y;
      doc.font("Helvetica-Bold");
      doc.text("No", 30, y);
      doc.text("Tanggal", 70, y);
      doc.text("Customer", 140, y);
      doc.text("Alamat", 220, y);
      doc.text("Total", 380, y);
      doc.text("Status", 460, y);
      doc.font("Helvetica");

      orders.forEach((order, i) => {
        y += 20;
        if (y > 750) {
          doc.addPage();
          y = 50;
          doc.font("Helvetica-Bold");
          doc.text("No", 30, y);
          doc.text("Tanggal", 70, y);
          doc.text("Customer", 140, y);
          doc.text("Alamat", 220, y);
          doc.text("Total", 380, y);
          doc.text("Status", 460, y);
          doc.font("Helvetica");
          y += 20;
        }
        doc.text(i + 1, 30, y);
        doc.text(new Date(order.createdAt).toLocaleDateString("id-ID"), 70, y);
        doc.text(order.customer?.name || "-", 140, y);
        doc.text(order.delivery_address?.substring(0, 40) || "-", 220, y);
        doc.text(`Rp${Number(order.total_price).toLocaleString()}`, 380, y);
        doc.text(order.status, 460, y);
      });

      doc.end();
    } catch (error) {
      console.error("Export PDF error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

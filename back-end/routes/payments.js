const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Payment = require("../models/Payment");
const Student = require("../models/Student");

// @route   POST api/payments
// @desc    Create a new payment
// @access  Private
router.post("/", auth, async (req, res) => {
  const { student, installment, amount, method, paymentDate } = req.body;
  try {
    const studentObj = await Student.findById(student);
    if (!studentObj) {
      return res.status(404).json({ msg: "Student not found" });
    }
    
    // Check if payment already exists for this student and installment
    const existingPayment = await Payment.findOne({
      student: student,
      installment: installment
    });
    
    if (existingPayment) {
      return res.status(400).json({ 
        msg: "پرداخت برای این ماه و سال قبلاً ثبت شده است",
        paymentId: existingPayment._id
      });
    }
    
    const newPayment = new Payment({
      student,
      installment,
      amount,
      method,
      date: paymentDate || Date.now(),
      createdBy: req.user.id,
    });
    
    const payment = await newPayment.save();
    // Populate the createdBy field before returning
    await payment.populate("createdBy", "username");
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @route   PUT api/payments/:id
// @desc    Update a payment
// @access  Private (Administrator only)
router.put("/:id", auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== "administrator") {
    return res.status(403).json({ msg: "Access denied" });
  }
  const { installment, amount, method } = req.body;
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }
    payment.installment = installment || payment.installment;
    payment.amount = amount || payment.amount;
    payment.method = method || payment.method;
    await payment.save();
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/payments/:id
// @desc    Delete a payment
// @access  Private (Administrator only)
router.delete("/:id", auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== "administrator") {
    return res.status(403).json({ msg: "Access denied" });
  }
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }
    res.json({ msg: "Payment removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/payments/student/:studentId/status
// @desc    Get student payment status for specific month/year or overall
// @access  Private
router.get("/student/:studentId/status", auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // If month and year are provided, calculate status for that specific month
    if (month && year) {
      // Create date range for the specified month
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // Handle month overflow (December -> January next year)
      let startDate, endDate;
      if (monthNum === 12) {
        startDate = new Date(`${yearNum}-12-01`);
        endDate = new Date(`${yearNum + 1}-01-01`);
      } else {
        startDate = new Date(
          `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`
        );
        endDate = new Date(
          `${yearNum}-${(monthNum + 1).toString().padStart(2, "0")}-01`
        );
      }

      // Get payments for this student in the specified month
      const payments = await Payment.find({
        student: studentId,
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      const totalPaid = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      let status;
      if (totalPaid > 0) {
        status = "پرداخت‌شده";
      } else {
        status = "پرداخت‌نشده";
      }

      res.json({
        totalPaid,
        status,
        month,
        year,
      });
    } else {
      // Original logic for overall status
      const payments = await Payment.find({ student: studentId });
      const totalPaid = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      let status;
      if (totalPaid > 0) {
        status = "پرداخت‌شده";
      } else {
        status = "پرداخت‌نشده";
      }

      res.json({
        totalPaid,
        status,
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/payments/student/:studentId/payments-by-month
// @desc    Get student payments for specific month and year
// @access  Private
router.get("/student/:studentId/payments-by-month", auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({ msg: "Month and year are required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // Format the installment string as "year/month" (without leading zero)
    const installment = `${year}/${month}`;

    // Get payments for this student with the matching installment
    const payments = await Payment.find({
      student: studentId,
      installment: installment,
    }).populate("createdBy", "username");

    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/payments/reports/monthly
// @desc    Get monthly tuition report
// @access  Private
router.get("/reports/monthly", auth, async (req, res) => {
  try {
    const { year, month } = req.query;

    // Handle month overflow (December -> January next year)
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    let startDate, endDate;
    if (monthNum === 12) {
      startDate = new Date(`${yearNum}-12-01`);
      endDate = new Date(`${yearNum + 1}-01-01`);
    } else {
      startDate = new Date(
        `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`
      );
      endDate = new Date(
        `${yearNum}-${(monthNum + 1).toString().padStart(2, "0")}-01`
      );
    }

    // Get payments for the specified month
    const payments = await Payment.find({
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    // Calculate total paid and payment count
    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const paymentCount = payments.length;

    res.json({
      totalPaid,
      paymentCount,
      month,
      year,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/payments/reports/annual
// @desc    Get annual tuition report
// @access  Private
router.get("/reports/annual", auth, async (req, res) => {
  try {
    const { year } = req.query;
    // Get payments for the specified year
    const payments = await Payment.find({
      date: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`),
      },
    });
    // Calculate total paid and payment count
    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const paymentCount = payments.length;
    res.json({
      totalPaid,
      paymentCount,
      year,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// @route   GET api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get("/", auth, (req, res) => {
  res.json({
    msg: "Welcome to the dashboard",
    stats: {
      students: 245,
      teachers: 18,
      classes: 12,
      revenue: 12500000,
    },
    recentActivities: [
      {
        id: 1,
        action: "ثبت دانش‌آموز جدید",
        user: "علی رضایی",
        time: "۲ ساعت پیش",
      },
      { id: 2, action: "پرداخت شهریه", user: "مریم احمدی", time: "۳ ساعت پیش" },
      {
        id: 3,
        action: "ایجاد کلاس جدید",
        user: "مدیر سیستم",
        time: "۵ ساعت پیش",
      },
    ],
  });
});

module.exports = router;

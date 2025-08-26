const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   PUT api/users/password/:userType
// @desc    Change password for admin or administrator
// @access  Private
router.put('/password/:userType', auth, async (req, res) => {
  const { userType } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Validate userType
  if (userType !== 'admin' && userType !== 'administrator') {
    return res.status(400).json({ msg: 'نوع کاربر نامعتبر است' });
  }

  try {
    // Find the user by username (which is the userType)
    const user = await User.findOne({ username: userType });
    if (!user) {
      return res.status(404).json({ msg: 'کاربر یافت نشد' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'رمز عبور فعلی اشتباه است' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ msg: 'رمز عبور با موفقیت تغییر یافت' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطای سرور');
  }
});

module.exports = router;
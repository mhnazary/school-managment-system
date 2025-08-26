const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Check if users already exist
    const adminExists = await User.findOne({ username: 'admin' });
    const administratorExists = await User.findOne({ username: 'administrator' });

    if (adminExists && administratorExists) {
      console.log('Users already exist');
      process.exit();
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: adminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created');

    // Create administrator user
    const administratorPassword = await bcrypt.hash('admin123', 10);
    const administrator = new User({
      username: 'administrator',
      password: administratorPassword,
      role: 'administrator'
    });
    await administrator.save();
    console.log('Administrator user created');

    console.log('Users created successfully');
    process.exit();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

createUsers();
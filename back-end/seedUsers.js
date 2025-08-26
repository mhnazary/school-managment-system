const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'administrator'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');
    seedUsers();
  })
  .catch(err => console.log(err));

// Seed users
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const administratorPassword = await bcrypt.hash('admin123', 10);
    
    // Create users
    await User.insertMany([
      {
        username: 'admin',
        password: adminPassword,
        role: 'admin'
      },
      {
        username: 'administrator',
        password: administratorPassword,
        role: 'administrator'
      }
    ]);
    
    console.log('Users seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
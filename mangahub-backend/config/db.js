const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ใส่ URI ของ MongoDB (หรือ local: mongodb://127.0.0.1:27017/mangahub)
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mangahub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
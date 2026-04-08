import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,   // Must provide name
    trim: true        // Remove extra spaces
  },
  email: {
    type: String,
    required: true,
    unique: true,     // No duplicate emails
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, { timestamps: true }); // Adds createdAt, updatedAt automatically


// Auto-hash password before saving to DB
userSchema.pre('save', async function (next) {
  // Only hash if password was changed
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  // next();
});

export default mongoose.model('User', userSchema);
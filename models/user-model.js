const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isActivated: { type: Boolean, default: false },
  tariff: { type: String, required: true, default: 'none' },
  smsCode: { type: String },
  balance: { type: Number, required: true, default: 0 },
})

module.exports = model('User', UserSchema)

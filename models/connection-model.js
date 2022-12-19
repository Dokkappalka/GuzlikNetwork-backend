const { Schema, model } = require('mongoose')

const ConnectionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  userTariff: { type: String, required: true },
  ip: { type: String, required: true },
  endDate: { type: Date, trquired: true },
})

module.exports = model('Connection', ConnectionSchema)

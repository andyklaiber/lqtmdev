const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  name: String,
  externalId: String,
  startDate: Date,
  showResults: Boolean
})

module.exports = mongoose.model('Event', eventSchema)
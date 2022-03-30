const mongoose = require('mongoose')

const seriesSchema = new mongoose.Schema({
  name: String,
  externalId: String,
  events: Array,
  active: Boolean,
})

module.exports = mongoose.model('Series', seriesSchema)
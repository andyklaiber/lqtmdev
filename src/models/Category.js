const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: String,
  identifier: String,
  displayOrder: String,
  minAge: Number,
  maxAge: Number,
})

module.exports = mongoose.model('Category', categorySchema)
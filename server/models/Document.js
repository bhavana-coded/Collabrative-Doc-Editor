const mongoose = require("mongoose");

const Document = new mongoose.Schema({
  _id: String,
  content: String,
  title: {
    type: String,
    default: "Untitled Document"
  }
});

module.exports = mongoose.model("Document", Document);

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const Document = require('./models/Document');

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Get all documents
app.get("/api/documents", async (req, res) => {
  const docs = await Document.find();
  res.send(docs);
});

// Rename a document
app.post("/api/documents/:id/rename", async (req, res) => {
  const { title } = req.body;
  await Document.findByIdAndUpdate(req.params.id, { title });
  res.send({ success: true });
});

// Delete a document
app.delete("/api/documents/:id", async (req, res) => {
  await Document.findByIdAndDelete(req.params.id);
  res.send({ success: true });
});

// Socket.IO
io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    let document = await Document.findById(documentId);
    if (!document) {
      document = await Document.create({ _id: documentId, content: "", title: "Untitled Document" });
    }

    socket.join(documentId);
    socket.emit("load-document", document.content);

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { content: data });
    });
  });
});

server.listen(3001, () => console.log("🚀 Server running on port 3001"));

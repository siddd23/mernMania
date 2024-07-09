const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  receiverName: {
    type: String,
    required: true,
  },
  taskName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['created', 'edited', 'deleted'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

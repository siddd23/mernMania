const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'high'],
    default: 'low',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'done'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  collaborators: {
    type: [String], // Array of emails
    default: [],
  },
  collaboratorRequests: [
    {
      email: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
      },
    },
  ],
});

taskSchema.virtual('pendingRequests').get(function() {
  return this.collaboratorRequests.filter((request) => request.status === 'pending');
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

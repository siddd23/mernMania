const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http");
const { Server } = require('socket.io');
const Task = require('./Models/Task');
const Notification = require('./Models/Notification');
const mongoose = require("mongoose");
const cors = require("cors");
app.use(cors());

app.use(bodyParser.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://siddharthjangid.netlify.app/",
  },
});
// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://siddharthj2002:3CXKbruY9FjVrwRF@cluster0.nwsqjuu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

  let onlineUsers = [];
  const addNewUser = (username, socketId) => {
    !onlineUsers.some((user) => user.username === username) && onlineUsers.push({ username, socketId });
  };
  
  const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  };
  
  const getUser = (username) => onlineUsers.find((user) => user.username === username);
  
  io.on("connection", (socket) => {
    console.log('New client connected');
  
    socket.on("newUser", (username) => {
      addNewUser(username, socket.id);
    });
  
    socket.on("sendNotification", async ({ senderName, senderEmail, receiverName, type, taskName }) => {
      try {
        const newNotification = new Notification({
          senderName,
          senderEmail,
          receiverName,
          type,
          taskName,
        });
        await newNotification.save();
    
        const receiver = getUser(receiverName);
        if (receiver) {
          io.to(receiver.socketId).emit("getNotification", {
            senderName,
            type,
            taskName,
          });   
        } else {
          console.error(`User ${receiverName} not found`);
        }
      } catch (error) {
        console.error("Error saving notification:", error);
      }
    });
    
  
    socket.on("disconnect", () => {
      console.log('Client disconnected');
      removeUser(socket.id);
    });
  });
  
// POST /tasks/create
app.post('/tasks/create', async (req, res) => {
  const { taskName, description, dueDate, priority, status, ownerEmail } = req.body;

  try {
    const newTask = new Task({
      taskName,
      description,
      dueDate,
      priority,
      status,
      ownerEmail,
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /tasks/:id
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { taskName, description, dueDate, priority, status } = req.body;

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { taskName, description, dueDate, priority, status },
      { new: true }
    );

    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Task.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
// POST /tasks/:id/collaborate
app.post('/tasks/:id/collaborate', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    const task = await Task.findById(id);
    task.collaboratorRequests.push({ email });
    await task.save();
    res.status(200).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /tasks/:id/collaborate
// PUT /tasks/:id/collaborate
app.put('/tasks/:id/collaborate', async (req, res) => {
  const { id } = req.params;
  const { email, status } = req.body;

  try {
    const task = await Task.findById(id);
    const request = task.collaboratorRequests.find(
      (req) => req.email === email
    );

    if (request) {
      request.status = status;
      if (status === 'accepted') {
        task.collaborators.push(email);
      } else if (status === 'rejected') {
        task.collaboratorRequests = task.collaboratorRequests.filter(
          (req) => req.email !== email
        );
      }
      await task.save();
      res.status(200).json(task);
    } else {
      res.status(404).json({ error: 'Request not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /collaboration-requests
app.get('/collaboration-requests', async (req, res) => {
  try {
    const tasks = await Task.find({
      'collaboratorRequests.status': 'pending',
      ownerEmail: req.query.email, // assuming you are passing the user email as a query parameter
    });

    const collaborationRequests = tasks.flatMap((task) =>
      task.collaboratorRequests
        .filter((request) => request.status === 'pending')
        .map((request) => ({
          ...request.toObject(),
          taskId: task._id,
          taskName: task.taskName,
        }))
    );

    res.status(200).json(collaborationRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// // GET /tasks
// app.get("/tasks", async (req, res) => {
//   try {
//     const tasks = await Task.find().sort({ createdAt: -1 });
//     res.json(tasks);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// Example: Fetch notifications for a specific user
app.get('/notifications', async (req, res) => {
  
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get("/api", (req, res) => {
  res.json({ "users": ["userOne", "userTwo", "userThree"] });
});

server.listen(5000, () => {
  console.log("Server started on port 5000");
});

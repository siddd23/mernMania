import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Sidebar";
import socketIOClient from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import { FaBell } from 'react-icons/fa';

Modal.setAppElement("#root");
const ENDPOINT = "http://localhost:5000";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const LandingPage = () => {
  const { user } = useUser();
  const userNameContent = user?.fullName;
  const userEmail = user?.primaryEmailAddress.emailAddress;
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("low");
  const [status, setStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [collaborationRequests, setCollaborationRequests] = useState([]);
  const openNotificationModal = () => setModalOpen(true);
  const closeNotificationModal = () => setModalOpen(false);
  const [notification, setNotification] = useState([]);
  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    done: 0,
  });
  const [taskPriorityCounts, setTaskPriorityCounts] = useState({
    high: 0,
    low: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [tasks, filter, searchQuery]);
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/notifications`);
      setNotification(response.data); // Assuming 'response.data' contains the array of notifications
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  
  

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on("connect", () => {
      console.log("Connected to socket server");

      // Replace 'YourUsername' with the actual username of the logged-in user
      socket.emit("newUser", userNameContent);
    });

    socket.on("getNotification", (data) => {
      const newNotification = `Task '${data.taskName}' has been ${data.type} by ${data.senderName}.`;
      setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/tasks");
      setTasks(response.data);
      setFilteredTasks(response.data); // Initialize filtered tasks with all tasks
      calculateCounts(response.data);
      calculatePriorityCounts(response.data);
      // Fetch collaboration requests
      const requestsResponse = await axios.get("http://localhost:5000/collaboration-requests");
      setCollaborationRequests(requestsResponse.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const calculateCounts = (tasks) => {
    const total = tasks.length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;
    const done = tasks.filter((task) => task.status === "done").length;

    setTaskCounts({ total, pending, inProgress, done });
  };

  const calculatePriorityCounts = (tasks) => {
    const high = tasks.filter((task) => task.priority === "high").length;
    const low = tasks.filter((task) => task.priority === "low").length;

    setTaskPriorityCounts({ high, low });
  };

  const applyFilter = () => {
    let filtered = tasks;

    if (filter === "high" || filter === "low") {
      filtered = tasks.filter((task) => task.priority === filter);
    } else if (filter !== "all") {
      filtered = tasks.filter((task) => task.status === filter);
    }

    if (searchQuery) {
      filtered = filtered.filter((task) =>
        task.taskName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const openModal = (task = null) => {
    if (task) {
      setTaskId(task._id);
      setTaskName(task.taskName);
      setDescription(task.description);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setStatus(task.status);
    } else {
      setTaskId(null);
      setTaskName("");
      setDescription("");
      setDueDate("");
      setPriority("low");
      setStatus("pending");
    }
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setTaskId(null);
    setTaskName("");
    setDescription("");
    setDueDate("");
    setPriority("low");
    setStatus("pending");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const socket = socketIOClient("http://localhost:5000");
      const receiverName = userNameContent; // Replace with the actual receiver's username
      const senderName = userNameContent; // Replace with the actual sender's username
      const senderEmail = userEmail; // Include sender's email
  
      if (taskId) {
        // Update task
        await axios.put(`http://localhost:5000/tasks/${taskId}`, {
          taskName,
          description,
          dueDate,
          priority,
          status,
        });
        toast.success("Task updated successfully!");
        socket.emit("sendNotification", {
          senderName,
          senderEmail,
          receiverName,
          type: "edited",
          taskName,
        });
      } else {
        // Create new task
        await axios.post("http://localhost:5000/tasks/create", {
          taskName,
          description,
          dueDate,
          priority,
          status,
          ownerEmail: userEmail,
        });
        toast.success("Task created successfully!");
        socket.emit("sendNotification", {
          senderName,
          senderEmail,
          receiverName,
          type: "created",
          taskName,
        });
      }
  
      fetchTasks();
      closeModal();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  
  
  const handleDeleteTask = async (taskId, taskName) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (confirmDelete) {
      try {
        const socket = socketIOClient("http://localhost:5000");
        const receiverName = userNameContent; // Replace with the actual receiver's username
        const senderName = userNameContent; // Replace with the actual sender's username
        const senderEmail = userEmail; // Include sender's email
        await axios.delete(`http://localhost:5000/tasks/${taskId}`);
        socket.emit("sendNotification", {
          senderName,
          senderEmail,
          receiverName,
          type: "deleted",
          taskName,
        });
        fetchTasks();
        toast.success("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCollaborateRequest = async (taskId) => {
    if (!userEmail) {
      // User is not authenticated, handle this case (redirect to login or show a message)
      toast.error("User is not authenticated. Please log in to send collaboration requests.");
      // Example: Redirect to login page or show an alert
      return;
    }
  
    try {
      await axios.post(`http://localhost:5000/tasks/${taskId}/collaborate`, {
        email: userEmail,
      });
      toast.success("Collaboration request sent!");
      fetchTasks();
    } catch (error) {
      console.error("Error sending collaboration request:", error);
      toast.error("Failed to send collaboration request.");
    }
  };
  
  
  const handleCollaborateResponse = async (taskId, email, status) => {
    try {
      await axios.put(`http://localhost:5000/tasks/${taskId}/collaborate`, {
        email,
        status,
      });
      toast.success(`Collaboration request ${status}!`);
      fetchTasks(); // Refresh tasks after response
    } catch (error) {
      console.error(`Error ${status} collaboration request:`, error);
      toast.error(`Failed to ${status} collaboration request.`);
    }
  };

  return (
    <div className="container">
      <Sidebar setFilter={setFilter} taskCounts={taskCounts} taskPriorityCounts={taskPriorityCounts} />
      <div className="task-list-container">
        <ToastContainer />
        <div className="task-list-header">
          <button className="add-task-button" onClick={() => openModal(null)}>
            Add Task
          </button>
          <div className="search-container">
            <div className="notification-icon" onClick={openNotificationModal}>
              <FaBell size={24} color="blue" />
              {notifications.length > 0 && (
                <span className="badge">{notifications.length}</span>
              )}
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        {modalOpen && (
            <div className="notification-modal">
              <div className="notification-header">
                <h3>Notifications</h3>
                <button className="close-button" onClick={closeNotificationModal}>
                  Close
                </button>
              </div>
              <ul className="notification-list-modal">
                {notification && notification.length > 0 ? (
                  notification.map((notif, index) => (
                    <li key={index}>
                      {/* Render individual properties of the notification object */}
                      Task '{notif.taskName}' has been {notif.type} by {notif.senderEmail}.
                    </li>
                  ))
                ) : (
                  <li>No notifications available.</li>
                )}
              </ul>
            </div>
          )}

        {filteredTasks.map((task) => (
          <div className="task-card" key={task._id}>
            <p>Posted By: {task.ownerEmail}</p>
            <h3>{task.taskName}</h3>
            <p>{task.description}</p>
            <p>Due Date: {new Date(task.dueDate).toLocaleDateString()}</p>
            <p>Priority: {task.priority}</p>
            <p>Status: {task.status}</p>
            <div className="message-actions">
              { task.ownerEmail === userEmail && (
                <>
                  <button className="edit-button" onClick={() => openModal(task)}>
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteTask(task._id, task.taskName)}>
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                  <button className="view-requests-button" onClick={() => setCollaborationRequests(task._id)}>
                    View Requests
                  </button>
                </>
              )}
              {task.ownerEmail !== userEmail && !task.collaborators.includes(userEmail) && (
                <button className="collaborate-button" onClick={() => handleCollaborateRequest(task._id)}>
                  Request to Collaborate
                </button>
              )}
              {task.collaborators.includes(userEmail) && (
                <p className="role-tag">Role: Collaborator</p>
              )}
             
            </div>
            {(task.collaborators.includes(userEmail)) && (
                    <>
                      <button className="edit-button" onClick={() => openModal(task)}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </>
                  )}
            {collaborationRequests === task._id && (
              <div className="collaboration-requests">
                {task.collaboratorRequests.length > 0 ? (
                  task.collaboratorRequests.map((request) => (
                    <div key={request._id} className="collaboration-request">
                      <p>
                        Collaboration Request from {request.email}:
                        {request.status === 'pending' && (
                          <>
                            <button onClick={() => handleCollaborateResponse(task._id, request.email, 'accepted')}>
                              Accept
                            </button>
                            <button onClick={() => handleCollaborateResponse(task._id, request.email, 'rejected')}>
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <span> Collaboration Accepted</span>
                        )}
                        {request.status === 'rejected' && (
                          <span> Collaboration Rejected</span>
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No collaboration requests available.</p>
                )}
              </div>
            )}
            <p className="task-time">
              {new Date(task.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }) +
                " at " +
                new Date(task.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
            </p>
          </div>
        ))}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Create Task Modal"
          className={"react-modal-content"}
        >
          <h2>{taskId ? "Edit Task" : "Create Task"}</h2>
          <form onSubmit={handleFormSubmit}>
            <label>
              Task Name:
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
              />
            </label>
            <br />
            <label>
              Description:
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
            <br />
            <label>
              Due Date:
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>
            <br />
            <label>
              Priority:
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
              >
                <option value="low">Low</option>
                <option value="high">High</option>
              </select>
            </label>
            <br />
            <label>
              Status:
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <br />
            <button type="submit">{taskId ? "Update" : "Submit"}</button>
            <button type="button" onClick={closeModal}>
              Cancel
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default LandingPage;

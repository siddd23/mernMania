import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import Navigation from "./Navigation";

const ENDPOINT = "http://localhost:5000";

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on("connect", () => {
      console.log("Connected to socket server");

      // Replace 'YourUsername' with the actual username of the logged-in user
      socket.emit("newUser", "YourUsername");
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

  return (
    <div className="notifications">
      <Navigation />
      <h3>Notifications</h3>
      <ul>
        {notifications.map((notification, index) => (
          <li key={index}>{notification}</li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationComponent;

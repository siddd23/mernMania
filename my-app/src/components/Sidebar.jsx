import React, { useState } from "react";
import { FaBars } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ setFilter, taskCounts, taskPriorityCounts }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <div className={`sidebar-toggle ${isSidebarOpen ? 'open' : ''}`} onClick={handleToggleSidebar}>
        <FaBars />
      </div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h2>Task Categories</h2>
        <div onClick={() => setFilter("all")} className="totalTask">
          Total Tasks ({taskCounts.total})
        </div>
        <ul>
          <li onClick={() => setFilter("pending")}>Pending Tasks ({taskCounts.pending})</li>
          <li onClick={() => setFilter("in-progress")}>In-Progress Tasks ({taskCounts.inProgress})</li>
          <li onClick={() => setFilter("done")}>Completed Tasks ({taskCounts.done})</li>
        </ul>
        <div onClick={() => setFilter("all")} className="priorityTask">
          Task Priority
        </div>
        <ul>
          <li onClick={() => setFilter("high")}>High Priority ({taskPriorityCounts.high})</li>
          <li onClick={() => setFilter("low")}>Low Priority ({taskPriorityCounts.low})</li>
        </ul>
      </div>
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={handleToggleSidebar}></div>
    </>
  );
};

export default Sidebar;

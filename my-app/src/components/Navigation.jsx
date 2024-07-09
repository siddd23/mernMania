import React, { useState } from 'react';
import { UserButton } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from 'react-router-dom';


const Navigation = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const userNameContent = user?.fullName;
  const userEmail = user?.primaryEmailAddress.emailAddress;
 
  return (
    <nav className="navbar">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Task Management System
        </Link>

        <div className="user-container">
          {user && <div className="userName">{userNameContent}</div>}
          {!user ? (
            <button
              onClick={() => navigate('/sign-in')}
              className="sign-in-button"
            >
              Sign In
            </button>
          ) : (
            <>
              <UserButton />
               {/* Add notifications component here */}
            </>
          )}
        </div>
      </div>
        {/* Notification Modal */}
        
      
    </nav>
  );
};

export default Navigation;

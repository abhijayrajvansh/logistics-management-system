'use client'

import useUsers from '@/hooks/useUsers'
import React from 'react'

const Playground = () => {
  const { users, error, isLoading } = useUsers();
  
  return (
    <div>
      {isLoading && <p>Loading users...</p>}
      
      {error && <p className="error">Error: {error.message}</p>}
      
      {users && (
        <div className="users-container">
          <h2>Users List</h2>
          {users.length === 0 ? (
            <p>No users found</p>
          ) : (
            <ul>
              {users.map(user => (
                <li>{user.displayName}, {user.role}, {user.location}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default Playground;
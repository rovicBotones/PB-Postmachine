# Role Management System Documentation

## Overview

This project includes a basic role-based access control (RBAC) system that provides simple permission management across the application using the original implementation.

## Key Features

- ✅ **Basic Role Management**: Simple role and permission assignment
- ✅ **User Role Assignment**: Assign roles to users through the admin interface
- ✅ **Permission Checking**: Basic permission validation in sidebar navigation
- ✅ **Database Integration**: Works with existing Supabase tables
- ✅ **Admin Interface**: Simple UI for managing user roles and permissions

## Architecture

### Core Components

1. **Role Service** (`utils/role.service.ts`)
   - Basic role management operations
   - Permission upsert and delete functionality
   - Legacy role fetching methods

2. **Users Service** (`utils/users.service.ts`)
   - User role assignment
   - Role validation and updating
   - Database interactions for user management

3. **User Role Table** (`app/components/user-role-table.tsx`)
   - Admin interface for managing role permissions
   - Checkbox-based permission assignment
   - Basic role management UI

4. **App Sidebar** (`app/components/app-sidebar.tsx`)
   - Permission-based navigation filtering
   - Simple role checking for menu items

## Basic Permissions

The system uses simple predefined permissions:

- `users.view` - View user information
- `users.add` - Add new users
- `users.edit` - Edit user details
- `post.post` - Post content to Facebook

## Basic Roles

The system works with basic roles that can be assigned permissions through the admin interface.

## Getting Started

### User Management

1. **Access**: Navigate to `/users` page as an admin
2. **Role Management**: Use the role management interface to assign permissions to roles
3. **User Assignment**: Assign roles to users in the user management section

### Permission System

The system uses a simple checkbox-based permission assignment:
- Admins can check/uncheck permissions for each role
- Changes are saved when clicking "Save Changes"
- Users inherit permissions from their assigned role

## Database Schema

### Required Tables

1. **roles** - Contains role definitions
2. **user_roles** - Maps users to their assigned roles
3. **role_permissions** - Maps roles to their permissions

## Usage Examples

### Checking Permissions in Components

```typescript
// In app-sidebar.tsx - simple role-based filtering
const hasPermission = (item: any, userRole: string | undefined): boolean => {
  if (!userRole) return false;

  // Admin has access to everything
  if (userRole === 'admin') return true;

  // Map specific permissions to roles
  const rolePermissions: Record<string, string[]> = {
    'user': ['view.user'],
    'editor': ['view.user', 'edit.posts'],
    'moderator': ['view.user', 'edit.posts', 'print'],
  };

  const permissions = rolePermissions[userRole.toLowerCase()] || [];
  return permissions.includes(item.permission);
};
```

### Assigning Roles to Users

```typescript
// Update user role
const result = await updateUserRole(userId, newRole);
if (result.success) {
  console.log('Role updated successfully');
} else {
  console.error('Error:', result.error);
}
```

## Database Cleanup

If you need to remove any advanced permission features that were previously added, run the rollback script:

```sql
-- Run scripts/rollback-permissions-migration.sql in Supabase SQL Editor
-- This will clean up any advanced permission tables and functions
```

## Security Considerations

- Basic role checking is implemented in the UI
- Admin access is required for role management
- User role assignments are stored in the database
- Simple permission checking prevents unauthorized access to menu items

This basic system provides essential role management functionality while maintaining simplicity and compatibility with your existing database structure.
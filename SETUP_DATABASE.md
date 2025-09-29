# Database Setup Guide for Role and Permission Management

## 📋 Steps to Set Up Supabase Database

### 1. Run the SQL Schema

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/supabase-schema.sql`
4. **Execute the SQL** to create tables and setup

### 2. Verify Tables Created

After running the SQL, you should have these new tables:

- ✅ `permissions` - Stores all permissions (system and custom)
- ✅ `role_permission_assignments` - Links roles to permissions
- ✅ `role_permissions_view` - View for easy querying

### 3. Set Row Level Security (RLS)

The SQL script automatically sets up RLS policies:

- **Admins** can read all permissions
- **Super Admin** can create/update/delete permissions
- **Protected User ID** is configured for super admin access

### 4. Default Permissions

The system will automatically insert these default permissions:

| Permission | Value | Category |
|------------|-------|----------|
| View Users | `users.view` | User Management |
| Add Users | `users.add` | User Management |
| Edit Users | `users.edit` | User Management |
| Delete Users | `users.delete` | User Management |
| Post to Facebook | `post.post` | Content Management |
| Manage Roles | `roles.manage` | Administration |

### 5. Test the Setup

1. **Login as Super Admin** (user with ID: `58eb73bd-f087-47f8-a6b3-11c08c6f7eb4`)
2. **Go to Settings page**
3. **Click "New Permission"** button
4. **Create a test permission**
5. **Verify it appears** in the role management table

## 🔧 Features Available After Setup

### For Super Admin:
- ✅ **Create custom permissions** with label, value, description, category
- ✅ **Assign permissions to roles** using checkboxes
- ✅ **Manage all roles and permissions** without restrictions
- ✅ **Delete custom permissions** (system permissions protected)

### For Regular Admins:
- ✅ **View all permissions** including custom ones
- ✅ **Assign permissions to roles** they can manage
- ✅ **Create and manage roles** with available permissions

### Database Features:
- ✅ **Automatic permission loading** from database on page load
- ✅ **Real-time permission creation** saves immediately to database
- ✅ **RLS security** ensures only authorized users can manage permissions
- ✅ **System permission protection** prevents deletion of core permissions

## 🚨 Important Notes

1. **Protected User ID**: Update the protected user ID in the SQL script if needed
2. **Backup**: Always backup your database before running schema changes
3. **Testing**: Test permission creation in a development environment first
4. **Security**: RLS policies ensure only super admin can create permissions

## 📊 Database Schema Overview

```
permissions
├── id (Primary Key)
├── label (Display name)
├── value (System identifier)
├── description (What it does)
├── category (Grouping)
├── icon (UI icon name)
├── is_system (Protected system permissions)
├── created_by (User who created it)
└── created_at, updated_at (Timestamps)

role_permission_assignments
├── id (Primary Key)
├── role_id (Links to roles table)
├── permission_id (Links to permissions table)
└── created_at (Timestamp)
```

## 🔄 How It Works

1. **Permission Creation**: Super admin creates permission → Saved to database → Available immediately
2. **Role Assignment**: Admin assigns permission to role → Creates role_permission_assignment record
3. **Permission Loading**: Page loads → Fetches all permissions from database → Displays in UI
4. **Security**: RLS ensures only authorized users can perform actions

After completing these steps, your super admin will be able to create and manage custom permissions that persist in the database! 🎉
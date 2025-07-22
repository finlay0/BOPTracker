# Security & Authentication Guide

## 🔐 Authentication Flow

### User Authentication
- All routes are protected with authentication guards
- Users must sign up with email/password and winery join code
- Unauthenticated users are redirected to `/login`
- Users without winery association are redirected to login

### Admin Panel Access
- **Route**: `/admin`
- **Requirements**: 
  - Must be authenticated
  - Must have `role: 'owner'` OR
  - Must have admin email (`admin@boptracker.com`, `finlay@example.com`)
- **Protection**: Unauthorized users see "Access Denied" and are redirected

## 🛡️ Row Level Security (RLS)

All database tables implement RLS policies:
- Users can only access data from their own winery
- Admin operations require service role permissions
- Support messages are isolated by winery

## 🔑 Service Role Key Requirements

### Admin Operations That Need Service Role:
1. **User Creation** - `supabase.auth.admin.createUser()`
2. **User Deletion** - `supabase.auth.admin.deleteUser()`

### Setup Instructions:
1. Add `SUPABASE_SERVICE_ROLE_KEY` to your environment variables
2. Create a server-side admin client for these operations
3. Or use Supabase Dashboard for manual user management

## 🎯 Security Features Implemented

### ✅ Route Protection
- `/` - Requires authentication + winery membership
- `/admin` - Requires authentication + admin privileges
- `/login` - Public route

### ✅ Data Validation
- Email format validation
- Password strength requirements (8+ chars, upper, lower, number, special)
- Form input sanitization
- Database constraint validation

### ✅ Real Backend Integration
- ✅ Password changes via Supabase Auth
- ✅ Email changes via Supabase Auth  
- ✅ Support messages saved to database
- ✅ Dark mode persistence
- ✅ All CRUD operations use real database

### ✅ Error Handling
- Graceful error messages for users
- Console logging for debugging
- Fallback UI states for loading/errors
- Transaction rollback on failures

## 🚨 Security Checklist

- [x] Authentication guards on all protected routes
- [x] Admin panel access control
- [x] Row Level Security policies
- [x] Real password changes (no mock data)
- [x] Real email changes with validation
- [x] Support form saves to database
- [x] Input validation and sanitization
- [x] Error handling and logging
- [x] HTTPS in production (configure in deployment)
- [ ] Service role key setup for admin operations
- [ ] Rate limiting (implement in production)
- [ ] CORS configuration (configure in Supabase)

## 🔧 Environment Variables Required

```bash
# Required for all functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Required for admin user management
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎭 Admin User Setup

1. **Create First Admin User:**
   - Sign up normally through the app
   - Manually update their role to `'owner'` in Supabase Dashboard
   - Or use the admin email addresses defined in the code

2. **Admin Capabilities:**
   - Create/delete wineries
   - Create/delete users (requires service role)
   - View/manage support messages
   - Full system access

## 🛠️ Production Deployment Notes

1. **Enable HTTPS** - Required for secure authentication
2. **Configure CORS** - Set allowed origins in Supabase
3. **Set up monitoring** - Track authentication failures
4. **Regular backups** - Database and user data
5. **Update admin emails** - Replace example emails with real ones 
# Seller Applications Guide

## Overview

The Seller Applications system allows potential sellers to apply to join the KudiMall marketplace. Administrators can review, approve, or reject these applications through a dedicated admin interface.

## System Components

### 1. API Endpoint
**Base URL**: `/api/seller-applications`

The seller applications API provides the following endpoints:

#### Create Application (Public)
```
POST /api/seller-applications
```
Allows potential sellers to submit their application to join the marketplace.

**Required Fields**:
- firstName
- lastName
- email
- phone
- businessName
- businessType
- storeName
- storeDescription
- productCategories
- bankName
- accountHolderName
- accountNumber
- routingNumber
- idType
- idNumber

**Response**: 
```json
{
  "success": true,
  "message": "Application submitted successfully!",
  "applicationId": "APP-1234567890-XXXXX"
}
```

#### List Applications (Admin)
```
GET /api/seller-applications
```
Retrieves all seller applications with optional filtering.

**Query Parameters**:
- `status`: Filter by status (pending, reviewing, approved, rejected)
- `limit`: Number of results per page
- `offset`: Pagination offset

**Response**:
```json
{
  "applications": [...],
  "total": 100,
  "limit": 30,
  "offset": 0
}
```

#### Get Single Application (Admin)
```
GET /api/seller-applications/:id
```
Retrieves a specific application by its ID or application_id.

#### Update Application Status (Admin)
```
PATCH /api/seller-applications/:id
```
Updates the status of an application.

**Body**:
```json
{
  "status": "approved",
  "admin_notes": "Application looks good",
  "reviewed_by": "Admin Name"
}
```

**Valid Status Values**:
- `pending` - Initial state
- `reviewing` - Under review by admin
- `approved` - Application accepted
- `rejected` - Application rejected

#### Get API Information
```
GET /api/seller-applications/info
```
Returns detailed information about the API endpoints and admin interface location.

### 2. Admin Interface
**URL**: `/admin/applications`

The admin interface provides a user-friendly way to manage seller applications without directly calling the API.

**Features**:
- ✅ View all applications in a table format
- ✅ Filter applications by status
- ✅ View detailed information for each application
- ✅ Update application status (pending → reviewing → approved/rejected)
- ✅ Add admin notes
- ✅ Track review history

**Access**:
Direct browser access to `https://your-domain.com/admin/applications` or `http://localhost:3000/admin/applications` for local development.

### 3. Public Application Form
**URL**: `/seller-application`

Potential sellers can fill out the application form at this URL. The form submits data to the `/api/seller-applications` POST endpoint.

## Connection Between API and Admin Page

```
┌─────────────────────────────────────────────────────────────┐
│                    Seller Applications Flow                  │
└─────────────────────────────────────────────────────────────┘

   Public User                     API                    Admin
      │                            │                        │
      │  1. Fill application       │                        │
      │     form at:               │                        │
      │  /seller-application       │                        │
      │                            │                        │
      │  2. POST /api/             │                        │
      │     seller-applications    │                        │
      ├────────────────────────────►                        │
      │                            │                        │
      │  3. Application saved      │                        │
      │     in database            │                        │
      │                            │                        │
      │                            │  4. Admin accesses     │
      │                            │     /admin/applications│
      │                            │◄───────────────────────┤
      │                            │                        │
      │                            │  5. GET /api/          │
      │                            │     seller-applications│
      │                            ├────────────────────────►
      │                            │                        │
      │                            │  6. Admin reviews      │
      │                            │     application        │
      │                            │                        │
      │                            │  7. PATCH /api/        │
      │                            │     seller-applications│
      │                            │     /:id               │
      │                            │◄───────────────────────┤
      │                            │                        │
      │  8. Email notification     │  9. Status updated     │
      │     (if configured)        │     in database        │
      │◄───────────────────────────┤                        │
      │                            │                        │
```

## Email Notifications

When a new seller application is submitted, the system attempts to send an email notification to the admin email address configured in the environment variables.

**Configuration** (in `server/.env`):
```env
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password-or-app-password
EMAIL_HOST=smtp.example.com  # If not using Gmail
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Note**: If email is not configured, applications are still saved to the database and can be viewed in the admin interface. The system will log a warning but won't fail the application submission.

## Usage Examples

### For Developers

**Check API Information**:
```bash
curl https://kudimall.onrender.com/api/seller-applications/info
```

**Submit an Application** (for testing):
```bash
curl -X POST https://kudimall.onrender.com/api/seller-applications \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "businessName": "John'\''s Store",
    "businessType": "individual",
    "storeName": "John'\''s Awesome Store",
    "storeDescription": "Selling quality products",
    "productCategories": ["electronics", "fashion"],
    ...
  }'
```

**List All Applications**:
```bash
curl https://kudimall.onrender.com/api/seller-applications
```

**Filter by Status**:
```bash
curl https://kudimall.onrender.com/api/seller-applications?status=pending
```

**Update Application Status**:
```bash
curl -X PATCH https://kudimall.onrender.com/api/seller-applications/123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "admin_notes": "Great application!",
    "reviewed_by": "Admin Sarah"
  }'
```

### For Administrators

1. **Access the Admin Interface**:
   - Production: `https://kudimall.onrender.com/admin/applications`
   - Local: `http://localhost:3000/admin/applications`

2. **Filter Applications**:
   - Click on the filter buttons to view applications by status
   - All / Pending / Under Review / Approved / Rejected

3. **Review an Application**:
   - Click "View Details" on any application
   - Review all submitted information
   - Add notes in the "Admin Notes" section
   - Click appropriate action button:
     - "Mark as Reviewing" - Move to reviewing status
     - "Approve" - Accept the application
     - "Reject" - Decline the application

4. **Track Applications**:
   - View submission date
   - See who reviewed the application
   - Check review timestamp
   - Read admin notes from previous reviews

## Database Schema

Applications are stored in the `seller_applications` table:

**Key Fields**:
- `id`: Auto-increment primary key
- `application_id`: Unique application identifier (e.g., APP-1234567890-XXXXX)
- `status`: Current status (pending, reviewing, approved, rejected)
- `reviewed_by`: Name of admin who reviewed
- `reviewed_at`: Timestamp of review
- `admin_notes`: Notes added by admin
- `created_at`: Application submission timestamp
- `updated_at`: Last update timestamp

## Security Considerations

⚠️ **Important**: The current implementation does not include authentication for the admin interface. In a production environment, you should:

1. Add admin authentication
2. Implement role-based access control
3. Add audit logging for all admin actions
4. Implement rate limiting on the POST endpoint
5. Add CSRF protection

## Troubleshooting

**Problem**: Applications not showing in admin interface
- **Solution**: Check browser console for API errors. Verify the server is running and the database is accessible.

**Problem**: Email notifications not being sent
- **Solution**: Check email configuration in `server/.env`. Review server logs for email errors. Applications are still saved even if email fails.

**Problem**: Cannot update application status
- **Solution**: Check network tab for API errors. Ensure the application ID is correct.

## Support

For technical support or questions:
- Check server logs for detailed error messages
- Review the API documentation: `GET /api/seller-applications/info`
- Contact the development team

---

**Last Updated**: February 2026
**Version**: 2.0.0

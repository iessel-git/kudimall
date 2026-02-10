# Quick Test Links for New Features

## Seller Application System
**URL**: http://localhost:3000/seller-application

### How to Access:
1. Click "Apply to Become a Seller" button on homepage (new gold CTA section)
2. Footer → "For Sellers" → "Apply Now"
3. Visit /start-selling and click "Apply to Become a Seller" at bottom

### Test Flow:
1. Fill out Step 1: Personal Info (name, email, phone)
2. Fill out Step 2: Business Info (address, business type)
3. Fill out Step 3: Store Info (categories, social media - optional)
4. Fill out Step 4: Banking Info (account details)
5. Fill out Step 5: Verification (ID type/number, accept agreements)
6. Submit application → See success alert

**Try deliberately**:
- Skip required fields → See validation errors
- Navigate back and forth between steps
- Select multiple product categories
- Test all business types in dropdown

---

## Receipt Confirmation System
**URL**: http://localhost:3000/receipt-confirmation?orderId=TEST123

### Access Methods:
- Direct URL with order ID parameter
- (In production: from order tracking emails and account order history)

### Test Scenarios:

#### Happy Path (Everything OK):
1. Answer YES to "received all items"
2. Select "Perfect condition"
3. Select "Yes, matches description"
4. Click Continue
5. Give 5-star rating
6. Write optional review
7. Confirm receipt → See success screen

#### Issue Reporting Path:
1. Answer NO to "received all items" OR
2. Select "Damaged or defective" OR
3. Select "No, different from description"
4. Click Continue → Routed to issue reporting
5. Describe issue in detail
6. Submit issue → See support notification

#### Rating Variations:
- Try all 5 star ratings (1-5 stars)
- Watch rating text change (Poor → Excellent)
- Test with and without written review

---

## Visual Elements to Check

### Seller Application:
- ✓ Progress bar with 5 steps
- ✓ Step circles animate (grey → gold → green with checkmark)
- ✓ Form validation errors in red
- ✓ Required field asterisks (*)
- ✓ Check/uncheck category grid
- ✓ Security notice (green box with lock icon)
- ✓ Info boxes with yellow backgrounds
- ✓ Next/Previous buttons work correctly

### Receipt Confirmation:
- ✓ Order summary card displays correctly
- ✓ Blue escrow notice box
- ✓ Radio buttons for questions
- ✓ Yellow alert for issues
- ✓ Golden star rating (hover effect)
- ✓ Three success detail cards
- ✓ Green checkmark icon animation

---

## Mobile Testing
Test both pages on mobile (resize browser to < 768px):
- Forms stack to single column
- Progress bar wraps appropriately
- Buttons expand to full width
- Text remains readable
- All interactive elements are touch-friendly

---

## Common Test Data

### Personal Information:
- Name: John Doe
- Email: john.doe@example.com
- Phone: +1 (555) 123-4567

### Business Information:
- Business Name: Acme Retail LLC
- Address: 123 Commerce Street
- City: New York
- State: NY
- Zip: 10001
- Country: United States

### Store Information:
- Store Name: Acme Fashion Store
- Description: Premium fashion items and accessories
- Categories: Fashion & Apparel, Jewelry & Accessories

### Banking Information:
- Bank Name: Chase Bank
- Account Holder: John Doe
- Account Number: 123456789
- Routing Number: 021000021

### Verification:
- ID Type: Driver's License
- ID Number: DL123456789

---

## Browser Console Logs

When forms are submitted, check the browser console (F12) to see the data that would be sent to the backend:

**Seller Application**:
```javascript
Seller Application Submitted: {formData object}
```

**Receipt Confirmation**:
```javascript
Receipt Confirmation: {orderId, rating, review, etc.}
```

---

## Integration Points Ready for Backend

### API Endpoints to Implement:

1. **POST /api/seller-applications**
   - Accept complete application form
   - Return application ID
   - Trigger email verification

2. **GET /api/orders/:orderId**
   - Return order details for confirmation page

3. **POST /api/orders/:orderId/confirm-receipt**
   - Accept confirmation data and rating
   - Release escrow payment
   - Publish review

4. **POST /api/orders/:orderId/report-issue**
   - Create support ticket
   - Hold escrow payment
   - Notify support team

---

## Known Behaviors (Not Bugs)

1. **Seller Application**: On submit, shows browser alert → then redirects to homepage
   - In production: Would show custom success page or redirect to email verification

2. **Receipt Confirmation**: Uses mock order data
   - In production: Would fetch real order from API using orderId parameter

3. **File Uploads**: Display file inputs but don't process files yet
   - In production: Would upload to cloud storage (S3, Azure Blob, etc.)

---

## Next Steps for Production

- [ ] Implement backend API endpoints
- [ ] Add file upload functionality
- [ ] Configure email notifications
- [ ] Set up payment processor integration
- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add CAPTCHA to prevent bots
- [ ] Set up database schemas

---

## Quick Links Summary

- Homepage: http://localhost:3000/
- Seller Application: http://localhost:3000/seller-application
- Receipt Confirmation: http://localhost:3000/receipt-confirmation?orderId=TEST123
- Start Selling Info: http://localhost:3000/start-selling
- Help Center: http://localhost:3000/help-center
- Contact Us: http://localhost:3000/contact-us

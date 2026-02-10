# Email Setup Guide for kudimall@csetechsolution.com

## ✅ Your Email Configuration

Your email has been set up in: `c:\projectmall\kudimall\server\.env`

```env
EMAIL_USER=kudimall@csetechsolution.com
```

## 🔧 What You Need to Complete Setup

You need to get **SMTP settings** from your email hosting provider (csetechsolution.com). Contact your IT administrator or hosting provider and ask for:

### Required Information:

1. **SMTP Host** (Example: `smtp.csetechsolution.com` or `mail.csetechsolution.com`)
2. **SMTP Port** (Usually: `587` for TLS or `465` for SSL)
3. **Security Type** (Usually: `TLS` or `SSL`)
4. **Email Password** (Your email account password or app password)

---

## 📋 Common SMTP Settings by Provider

If your email is hosted with:

### **cPanel / WHM Hosting**
```env
EMAIL_HOST=mail.csetechsolution.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_PASSWORD=your-email-password
```

### **Microsoft 365 / Outlook Business**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_PASSWORD=your-email-password
```

### **Google Workspace (G Suite)**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_PASSWORD=your-app-password
```

### **Zoho Mail**
```env
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_PASSWORD=your-email-password
```

---

## 🔍 How to Find Your SMTP Settings

### Option 1: Check Your Email Client
Open your email in Outlook, Thunderbird, or Apple Mail:
- Go to Account Settings → Server Settings
- Look for "Outgoing Mail (SMTP)" settings

### Option 2: Contact Your Hosting Provider
Email or call your hosting provider (the company that hosts csetechsolution.com):
- GoDaddy: support.godaddy.com
- Bluehost: bluehost.com/help
- NameCheap: namecheap.com/support
- SiteGround: siteground.com/support

Ask them: **"What are the SMTP settings for sending mail from kudimall@csetechsolution.com?"**

---

## ✏️ Update Your .env File

Once you have the settings, open: `c:\projectmall\kudimall\server\.env`

Replace these values:
```env
EMAIL_USER=kudimall@csetechsolution.com
EMAIL_PASSWORD=your-actual-password-here    # ← Replace this
EMAIL_HOST=smtp.csetechsolution.com         # ← Replace this
EMAIL_PORT=587                               # ← Confirm this
EMAIL_SECURE=false                           # ← true if port is 465
```

---

## 🧪 Test Your Email Configuration

After updating .env, test it by creating a new seller account:

1. Restart your server: `npm run dev`
2. Go to: http://localhost:3000/seller/signup
3. Sign up with a test email
4. Check if you receive the verification email

---

## ⚠️ Troubleshooting

### "Connection refused" error
- Wrong EMAIL_HOST or EMAIL_PORT
- Check with your hosting provider

### "Authentication failed" error
- Wrong EMAIL_PASSWORD
- Some providers require an "app password" instead of your regular password

### "Connection timeout" error
- Your server might be blocking outgoing SMTP connections
- Try a different EMAIL_PORT (465 or 25)

### Email goes to spam
- Add SPF, DKIM, and DMARC records to your domain DNS
- Ask your hosting provider for help with this

---

## 📞 Need Help?

Contact your email hosting provider with this question:

> "I need SMTP settings to send automated emails from kudimall@csetechsolution.com 
> using Node.js and Nodemailer. What are the SMTP host, port, and security settings?"

They will provide you with the exact configuration! ✅

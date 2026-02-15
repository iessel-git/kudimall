const nodemailer = require('nodemailer');
const axios = require('axios');

const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const isPrivateOrLocalhost = (hostname) => {
  if (!hostname) {
    return true;
  }

  const value = hostname.toLowerCase();
  if (
    value === 'localhost' ||
    value === '127.0.0.1' ||
    value === '0.0.0.0' ||
    value === '::1'
  ) {
    return true;
  }

  if (/^10\./.test(value)) {
    return true;
  }

  if (/^192\.168\./.test(value)) {
    return true;
  }

  const match172 = /^172\.(\d{1,2})\./.exec(value);
  if (match172) {
    const secondOctet = Number(match172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
};

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const getFrontendCandidates = () => {
  const raw = `${process.env.PUBLIC_FRONTEND_URL || ''},${process.env.FRONTEND_URL || ''}`;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(isValidHttpUrl);
};

const getFrontendBaseUrl = () => {
  const candidates = getFrontendCandidates();
  if (candidates.length === 0) {
    return DEFAULT_FRONTEND_URL;
  }

  const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  if (!isProduction) {
    return candidates[0];
  }

  const publicCandidate = candidates.find((candidate) => {
    const { hostname } = new URL(candidate);
    return !isPrivateOrLocalhost(hostname);
  });

  return publicCandidate || candidates[0];
};

const getSmtpConfig = () => {
  const host = (process.env.EMAIL_HOST || 'smtp.example.com').trim();
  const requestedPort = Number.parseInt((process.env.EMAIL_PORT || '').trim(), 10);
  const port = Number.isInteger(requestedPort) && requestedPort > 0
    ? requestedPort
    : 587;
  let secure = parseBoolean(process.env.EMAIL_SECURE, port === 465);

  // Guard against common misconfiguration: port 587 should use STARTTLS, not implicit SSL
  if (port === 587 && secure) {
    secure = false;
  }

  const requireTLS = parseBoolean(process.env.EMAIL_REQUIRE_TLS, port === 587);

  return {
    host,
    port,
    secure,
    requireTLS,
    auth: {
      user: process.env.EMAIL_USER || 'noreply@example.com',
      pass: process.env.EMAIL_PASSWORD || 'your-password'
    },
    tls: {
      servername: host,
      rejectUnauthorized: false
    },
    connectionTimeout: 45000,
    greetingTimeout: 45000,
    socketTimeout: 60000
  };
};

const createEmailTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      },
      connectionTimeout: 45000,
      greetingTimeout: 45000,
      socketTimeout: 60000
    });
  }

  return nodemailer.createTransport(getSmtpConfig());
};

const getSmtpFallbackConfigs = () => {
  const primary = getSmtpConfig();
  const configs = [primary];

  if (primary.port === 587) {
    configs.push({
      ...primary,
      port: 465,
      secure: true,
      requireTLS: false
    });
  } else if (primary.port === 465) {
    configs.push({
      ...primary,
      port: 587,
      secure: false,
      requireTLS: true
    });
  }

  return configs;
};

const sendMailWithBrevoAPI = async (mailOptions) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY not set');
  }

  // Parse "from" field - can be "Name <email>" or just "email"
  let fromEmail = process.env.EMAIL_USER || 'kudimall@csetechsolution.com';
  let fromName = process.env.EMAIL_SENDER_NAME || 'KudiMall';
  
  if (typeof mailOptions.from === 'string') {
    const match = mailOptions.from.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      fromName = match[1].trim();
      fromEmail = match[2].trim();
    } else if (mailOptions.from.includes('@')) {
      fromEmail = mailOptions.from;
    }
  }

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: mailOptions.to }],
    subject: mailOptions.subject,
    htmlContent: mailOptions.html || mailOptions.text || ''
  };

  console.log('📧 Sending email via Brevo HTTP API to:', mailOptions.to);

  const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    timeout: 30000
  });

  console.log('✅ Email sent via Brevo API. MessageId:', response.data.messageId);
  return { messageId: response.data.messageId };
};

const sendMailWithFallback = async (mailOptions) => {
  // 1. Try Brevo HTTP API first (works on Render free tier - uses HTTPS port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      return await sendMailWithBrevoAPI(mailOptions);
    } catch (error) {
      console.error('❌ Brevo API failed:', error.response?.data || error.message);
      console.log('🔄 Falling back to SMTP...');
    }
  }

  // 2. Try Gmail if configured
  if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com')) {
    const transporter = createEmailTransporter();
    return transporter.sendMail(mailOptions);
  }

  // 3. Try SMTP as last resort
  const configs = getSmtpFallbackConfigs();
  let lastError = null;

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const transporter = nodemailer.createTransport(config);
    
    try {
      console.log(`📧 Attempting SMTP connection ${i + 1}/${configs.length}:`, {
        host: config.host,
        port: config.port,
        secure: config.secure,
        requireTLS: config.requireTLS,
        user: config.auth.user
      });

      await transporter.verify();
      console.log(`✅ SMTP connection verified successfully`);
      
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to}`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ SMTP attempt ${i + 1}/${configs.length} failed:`, {
        host: config.host,
        port: config.port,
        secure: config.secure,
        errorCode: error.code,
        errorMessage: error.message,
        command: error.command,
        response: error.response
      });
    }
  }

  console.error('❌ All email attempts failed.');
  throw lastError || new Error('Email send failed after all attempts');
};

const getEmailSender = () => {
  const emailUser = process.env.EMAIL_USER || 'noreply@kudimall.com';
  const senderName = process.env.EMAIL_SENDER_NAME || 'KudiMall';
  
  // Format as "KudiMall <email@example.com>" to hide raw email address
  return `${senderName} <${emailUser}>`;
};

module.exports = {
  createEmailTransporter,
  getFrontendBaseUrl,
  getSmtpConfig,
  parseBoolean,
  sendMailWithFallback,
  sendMailWithBrevoAPI,
  getEmailSender
};
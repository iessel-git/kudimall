import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSellerApplication } from '../services/api';
import '../styles/SupportPage.css';
import '../styles/ApplicationPage.css';

const SellerApplicationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Business Information
    businessName: '',
    businessType: 'individual',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    taxId: '',
    
    // Store Information
    storeName: '',
    storeDescription: '',
    productCategories: [],
    estimatedMonthlyVolume: '',
    
    // Social Media
    instagramHandle: '',
    facebookPage: '',
    twitterHandle: '',
    tiktokHandle: '',
    websiteUrl: '',
    
    // Banking Information
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '',
    
    // Verification Documents
    idType: 'passport',
    idNumber: '',
    
    // Agreements
    agreeToTerms: false,
    agreeToCommission: false,
    agreeToStandards: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'productCategories') {
      const updatedCategories = checked
        ? [...formData.productCategories, value]
        : formData.productCategories.filter(cat => cat !== value);
      
      setFormData({
        ...formData,
        productCategories: updatedCategories
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
    }
    
    if (step === 2) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.businessAddress) newErrors.businessAddress = 'Address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zipCode) newErrors.zipCode = 'Zip code is required';
      if (!formData.country) newErrors.country = 'Country is required';
    }
    
    if (step === 3) {
      if (!formData.storeName) newErrors.storeName = 'Store name is required';
      if (!formData.storeDescription) newErrors.storeDescription = 'Store description is required';
      if (formData.productCategories.length === 0) newErrors.productCategories = 'Select at least one category';
    }
    
    if (step === 4) {
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      if (!formData.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
      if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!formData.routingNumber) newErrors.routingNumber = 'Routing number is required';
    }
    
    if (step === 5) {
      if (!formData.idNumber) newErrors.idNumber = 'ID number is required';
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
      if (!formData.agreeToCommission) newErrors.agreeToCommission = 'You must agree to the commission structure';
      if (!formData.agreeToStandards) newErrors.agreeToStandards = 'You must agree to seller standards';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateStep(5)) {
      setSubmitting(true);
      setSubmitError('');
      
      try {
        const response = await submitSellerApplication(formData);
        const data = response.data;
        
        // Show success message
        alert(`✅ Application submitted successfully!\n\nApplication ID: ${data.applicationId}\n\nWe will review your application within 24-48 hours and send you an email with next steps at ${formData.email}.`);
        
        // Navigate to home page
        navigate('/');
      } catch (error) {
        console.error('Error submitting application:', error);
        setSubmitError(error.response?.data?.message || error.message || 'Failed to submit application. Please try again.');
        window.scrollTo(0, 0);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const categories = [
    'Electronics', 'Fashion & Apparel', 'Home & Garden', 'Beauty & Personal Care',
    'Sports & Outdoors', 'Toys & Games', 'Books & Media', 'Jewelry & Accessories',
    'Art & Crafts', 'Food & Beverages', 'Health & Wellness', 'Automotive'
  ];

  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Seller Application</h1>
          <p>Join thousands of successful sellers on KudiMall</p>
        </div>

        <div className="application-container">
          {/* Progress Bar */}
          <div className="progress-bar">
            <div className="progress-steps">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
                  <div className="step-circle">{step}</div>
                  <div className="step-label">
                    {step === 1 && 'Personal'}
                    {step === 2 && 'Business'}
                    {step === 3 && 'Store'}
                    {step === 4 && 'Banking'}
                    {step === 5 && 'Verify'}
                  </div>
                </div>
              ))}
            </div>
            <div className="progress-line">
              <div className="progress-fill" style={{ width: `${((currentStep - 1) / 4) * 100}%` }}></div>
            </div>
          </div>

          <form className="application-form" onSubmit={handleSubmit}>
            {/* Error Message */}
            {submitError && (
              <div className="submit-error">
                <span className="error-icon">⚠️</span>
                <div>
                  <h4>Submission Error</h4>
                  <p>{submitError}</p>
                  <p><small>Please check your information and try again. If the problem persists, contact support.</small></p>
                </div>
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="form-step">
                <h2>Personal Information</h2>
                <p className="step-description">Tell us about yourself</p>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Information */}
            {currentStep === 2 && (
              <div className="form-step">
                <h2>Business Information</h2>
                <p className="step-description">Provide your business details</p>

                <div className="form-group">
                  <label htmlFor="businessName">Business/Legal Name *</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={errors.businessName ? 'error' : ''}
                  />
                  {errors.businessName && <span className="error-message">{errors.businessName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="businessType">Business Type *</label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                  >
                    <option value="individual">Individual/Sole Proprietor</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                    <option value="nonprofit">Nonprofit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="businessAddress">Business Address *</label>
                  <input
                    type="text"
                    id="businessAddress"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    className={errors.businessAddress ? 'error' : ''}
                  />
                  {errors.businessAddress && <span className="error-message">{errors.businessAddress}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State/Province *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={errors.state ? 'error' : ''}
                    />
                    {errors.state && <span className="error-message">{errors.state}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zipCode">Zip/Postal Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className={errors.zipCode ? 'error' : ''}
                    />
                    {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={errors.country ? 'error' : ''}
                    />
                    {errors.country && <span className="error-message">{errors.country}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="taxId">Tax ID / EIN (Optional)</label>
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                  />
                  <small>Required for business entities in most countries</small>
                </div>
              </div>
            )}

            {/* Step 3: Store Information */}
            {currentStep === 3 && (
              <div className="form-step">
                <h2>Store Information</h2>
                <p className="step-description">Set up your KudiMall store</p>

                <div className="form-group">
                  <label htmlFor="storeName">Store Name *</label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    className={errors.storeName ? 'error' : ''}
                    placeholder="Your store name as it will appear on KudiMall"
                  />
                  {errors.storeName && <span className="error-message">{errors.storeName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="storeDescription">Store Description *</label>
                  <textarea
                    id="storeDescription"
                    name="storeDescription"
                    rows="4"
                    value={formData.storeDescription}
                    onChange={handleChange}
                    className={errors.storeDescription ? 'error' : ''}
                    placeholder="Describe what you sell and what makes your store unique"
                  ></textarea>
                  {errors.storeDescription && <span className="error-message">{errors.storeDescription}</span>}
                </div>

                <div className="form-group">
                  <label>Product Categories * (Select all that apply)</label>
                  <div className="checkbox-grid">
                    {categories.map((category) => (
                      <label key={category} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="productCategories"
                          value={category}
                          checked={formData.productCategories.includes(category)}
                          onChange={handleChange}
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                  {errors.productCategories && <span className="error-message">{errors.productCategories}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="estimatedMonthlyVolume">Estimated Monthly Sales Volume</label>
                  <select
                    id="estimatedMonthlyVolume"
                    name="estimatedMonthlyVolume"
                    value={formData.estimatedMonthlyVolume}
                    onChange={handleChange}
                  >
                    <option value="">Select range</option>
                    <option value="0-1000">$0 - $1,000</option>
                    <option value="1000-5000">$1,000 - $5,000</option>
                    <option value="5000-10000">$5,000 - $10,000</option>
                    <option value="10000-25000">$10,000 - $25,000</option>
                    <option value="25000+">$25,000+</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Social Media Presence (Optional but recommended)</label>
                  <div className="social-inputs">
                    <input
                      type="text"
                      name="instagramHandle"
                      value={formData.instagramHandle}
                      onChange={handleChange}
                      placeholder="Instagram handle"
                    />
                    <input
                      type="text"
                      name="facebookPage"
                      value={formData.facebookPage}
                      onChange={handleChange}
                      placeholder="Facebook page URL"
                    />
                    <input
                      type="text"
                      name="twitterHandle"
                      value={formData.twitterHandle}
                      onChange={handleChange}
                      placeholder="Twitter/X handle"
                    />
                    <input
                      type="text"
                      name="tiktokHandle"
                      value={formData.tiktokHandle}
                      onChange={handleChange}
                      placeholder="TikTok handle"
                    />
                    <input
                      type="url"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      placeholder="Website URL"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Banking Information */}
            {currentStep === 4 && (
              <div className="form-step">
                <h2>Banking Information</h2>
                <p className="step-description">For receiving payouts from sales</p>

                <div className="security-notice">
                  <span className="security-icon">🔒</span>
                  <p>Your banking information is encrypted and securely stored. We never share this data with third parties.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="bankName">Bank Name *</label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={errors.bankName ? 'error' : ''}
                  />
                  {errors.bankName && <span className="error-message">{errors.bankName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="accountHolderName">Account Holder Name *</label>
                  <input
                    type="text"
                    id="accountHolderName"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    className={errors.accountHolderName ? 'error' : ''}
                    placeholder="Name as it appears on the account"
                  />
                  {errors.accountHolderName && <span className="error-message">{errors.accountHolderName}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="accountNumber">Account Number *</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className={errors.accountNumber ? 'error' : ''}
                    />
                    {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="routingNumber">Routing Number *</label>
                    <input
                      type="text"
                      id="routingNumber"
                      name="routingNumber"
                      value={formData.routingNumber}
                      onChange={handleChange}
                      className={errors.routingNumber ? 'error' : ''}
                    />
                    {errors.routingNumber && <span className="error-message">{errors.routingNumber}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Verification & Agreement */}
            {currentStep === 5 && (
              <div className="form-step">
                <h2>Verification & Agreement</h2>
                <p className="step-description">Final step to complete your application</p>

                <div className="form-group">
                  <label htmlFor="idType">Government ID Type *</label>
                  <select
                    id="idType"
                    name="idType"
                    value={formData.idType}
                    onChange={handleChange}
                  >
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID Card</option>
                    <option value="state_id">State ID</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="idNumber">ID Number *</label>
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    className={errors.idNumber ? 'error' : ''}
                  />
                  {errors.idNumber && <span className="error-message">{errors.idNumber}</span>}
                  <small>You will be asked to upload a photo of your ID in the next step after submission</small>
                </div>

                <div className="agreements-section">
                  <h3>Agreements & Terms</h3>
                  
                  <label className="checkbox-agreement">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className={errors.agreeToTerms ? 'error' : ''}
                    />
                    <span>I agree to the <a href="/terms-of-service" target="_blank">Terms of Service</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a> *</span>
                  </label>
                  {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}

                  <label className="checkbox-agreement">
                    <input
                      type="checkbox"
                      name="agreeToCommission"
                      checked={formData.agreeToCommission}
                      onChange={handleChange}
                      className={errors.agreeToCommission ? 'error' : ''}
                    />
                    <span>I agree to the 10% commission structure on all completed sales *</span>
                  </label>
                  {errors.agreeToCommission && <span className="error-message">{errors.agreeToCommission}</span>}

                  <label className="checkbox-agreement">
                    <input
                      type="checkbox"
                      name="agreeToStandards"
                      checked={formData.agreeToStandards}
                      onChange={handleChange}
                      className={errors.agreeToStandards ? 'error' : ''}
                    />
                    <span>I agree to maintain KudiMall seller standards including accurate product descriptions, prompt shipping, and professional customer service *</span>
                  </label>
                  {errors.agreeToStandards && <span className="error-message">{errors.agreeToStandards}</span>}
                </div>

                <div className="info-box">
                  <h4>What happens next?</h4>
                  <ul>
                    <li>We'll review your application within 24-48 hours</li>
                    <li>You'll receive an email to upload verification documents</li>
                    <li>Once approved, you'll get access to your seller dashboard</li>
                    <li>Start listing products and sharing on social media immediately</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary">
                  Previous
                </button>
              )}
              
              {currentStep < 5 ? (
                <button type="button" onClick={nextStep} className="btn-primary">
                  Next Step
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerApplicationPage;

# Mobile Component Quick Reference

## 📱 Bottom Navigation Structure

```
┌─────────────────────────────────┐
│         CONTENT AREA            │
│                                 │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  🏠    🏪    📦    👤    💼     │ ← Bottom Nav (56px)
│ Home  Sellers Orders Account Sell │
└─────────────────────────────────┘
```

## 🎨 Mobile Layout Anatomy

```
┌─────────────────────────────────┐
│ 🔍 Logo    Search...             │ ← Header (60px, sticky)
├─────────────────────────────────┤
│                                 │
│  ┌─────────┐  ┌─────────┐      │ ← Product Grid (2-col)
│  │ Product │  │ Product │      │
│  │  $100   │  │  $200   │      │
│  └─────────┘  └─────────┘      │
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │ Product │  │ Product │      │
│  │  $150   │  │  $250   │      │
│  └─────────┘  └─────────┘      │
│                                 │
│                            70px │ ← Bottom padding
└─────────────────────────────────┘
│  🏠    🏪    📦    👤    💼     │ ← Bottom Nav (fixed)
└─────────────────────────────────┘
```

## 🎯 Touch Target Sizes

```
Minimum Sizes (Mobile):
├─ Buttons: 48px height
├─ Nav Items: 56px height
├─ Input Fields: 48px height
├─ Product Cards: 140px+ height
└─ Links: 44px tap area
```

## 📏 Spacing System (Mobile)

```
Container Padding:    16px
Grid Gaps:           10-12px
Section Padding:     36px vertical
Card Internal:       12-16px
Bottom Safe Area:    70px
```

## 🎨 Color Codes

```javascript
--lux-ink:         #0f1115  // Dark text
--lux-gold:        #c8a45a  // Primary accent
--lux-cream:       #fbf8f2  // Background
--lux-border:      #e1d6c2  // Borders
```

## 📐 Breakpoints

```css
/* Mobile: Default (0-768px) */
@media (max-width: 768px) {
  /* All mobile styles here */
}

/* Desktop: 769px+ */
@media (min-width: 769px) {
  /* Desktop overrides */
}
```

## 🎭 Key Classes

### Product Card
```css
.product-card {
  /* 2-column grid item */
  border-radius: 10px;
  overflow: hidden;
}

.product-image {
  height: 140px;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 13px;
  -webkit-line-clamp: 2;
}

.product-price {
  font-size: 16px;
  font-weight: 700;
}
```

### Bottom Navigation
```css
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  z-index: 999;
  height: 56px;
}

.mobile-nav-item {
  min-height: 56px;
  display: flex;
  flex-direction: column;
}

.mobile-nav-item.active {
  color: #c8a45a;
}
```

### Mobile Header
```css
.header-main {
  padding: 8px 0;
}

.logo {
  height: 40px;
}

.search-form {
  padding: 4px 16px;
  border-radius: 24px;
}
```

## 🔄 Common Patterns

### 2-Column Grid
```css
.products-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
```

### Single Column Form
```css
.checkout-layout {
  grid-template-columns: 1fr;
}
```

### Sticky Bottom Button
```css
.product-actions {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 12px;
}
```

## 🎬 Animation Classes

### Card Press
```css
.product-card:active {
  transform: scale(0.98);
}
```

### Button Press
```css
button:active {
  transform: scale(0.96);
  opacity: 0.85;
}
```

### Fade In
```css
animation: fadeIn 0.4s ease;
```

### Stagger Load
```css
animation: staggerFadeIn 0.4s ease backwards;
animation-delay: calc(var(--index) * 0.05s);
```

## 📱 Testing Commands

### Local Development
```bash
# Terminal 1 - Backend
cd server
npm install
npm start

# Terminal 2 - Frontend
cd client
npm install
npm start
```

### View on Mobile
```bash
# Get your IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Open on phone
http://YOUR_IP:3000
```

### Chrome DevTools
```
F12 → Device Toolbar → iPhone 12 Pro
```

## 🎨 Component Hierarchy

```
App
├─ Header
│  ├─ Logo
│  ├─ Search
│  └─ Desktop Nav (hidden on mobile)
│
├─ Mobile Bottom Nav (shown on mobile)
│  ├─ Home
│  ├─ Sellers
│  ├─ Orders
│  ├─ Account
│  └─ Sell
│
├─ Main Content
│  ├─ HomePage
│  │  ├─ Hero (compact on mobile)
│  │  ├─ Categories (2-col grid)
│  │  ├─ Sellers (1-col list)
│  │  └─ Products (2-col grid)
│  │
│  ├─ ProductPage
│  │  ├─ Image (full-width)
│  │  ├─ Details
│  │  └─ Buy Button (sticky)
│  │
│  └─ CategoryPage
│     └─ Products (2-col grid)
│
└─ Footer (compact on mobile)
```

## 🚀 Quick Customization

### Change Bottom Nav Icons
```javascript
// In Header.js
<span className="mobile-nav-icon">🏠</span>
// Replace emoji with your icon component
```

### Adjust Product Grid Columns
```css
/* Make it 3 columns */
.products-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
```

### Change Primary Color
```css
/* In index.css */
:root {
  --lux-gold: #your-color;
}
```

### Adjust Header Height
```css
/* In Header.css mobile section */
.logo {
  height: 50px; /* Change from 40px */
}
```

## ⚡ Performance Tips

1. **Images**: Use proper sizes (150x150 for product cards)
2. **Animations**: Keep under 0.3s duration
3. **Z-Index**: Keep below 1000 (except modals)
4. **Transforms**: Use instead of position changes
5. **Will-Change**: Apply to animated elements

## 🎯 Accessibility

```css
/* Focus visible for keyboard users */
:focus-visible {
  outline: 2px solid #c8a45a;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

## 📊 Mobile-First Media Query Template

```css
/* Mobile (default) */
.component {
  font-size: 14px;
  padding: 12px;
}

/* Desktop override */
@media (min-width: 769px) {
  .component {
    font-size: 16px;
    padding: 16px;
  }
}
```

---

**Quick Ref Version**: 1.0  
**Last Updated**: February 2026

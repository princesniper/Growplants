/**
 * GrowPlants — Bilingual Store (Zustand)
 * Source: 01_project_specification.md §1 (Bilingual Experience),
 *         05_recreation_prompts.md Prompt 4
 *
 * Client-side instant language toggle for EN/HI.
 * Persists to localStorage for unauthenticated users; syncs to Firestore
 * preferences.language for authenticated users (handled in SettingsContext).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_LANGUAGE } from "@/lib/constants";

export type Language = "en" | "hi";

/* ---------- Dictionary Keys ---------- */
/**
 * Keys are dot-namespaced by UI surface:
 *   nav.*        — navigation (header, footer, mobile nav)
 *   hero.*       — homepage hero
 *   shop.*       — shop page
 *   pdp.*        — product detail page
 *   cart.*       — cart + drawer
 *   checkout.*   — checkout flow
 *   account.*    — account dashboard
 *   service.*    — services + booking
 *   provider.*   — provider portal
 *   admin.*      — admin panel
 *   common.*     — shared buttons, labels, errors
 *   cms.*        — about, contact, faq, terms, etc.
 *   empty.*      — empty states
 *   error.*      — error states
 *
 * Phase 1 ships a foundational key set. New keys will be added per phase
 * as pages are built. Always add the key to BOTH en and hi dictionaries.
 */
export const translations = {
  en: {
    /* Brand */
    "brand.name": "GrowPlants",
    "brand.tagline": "Plants, Planters & Gardening Services in Sonipat",

    /* Common — Buttons */
    "common.btn.shopNow": "Shop Now",
    "common.btn.bookService": "Book a Service",
    "common.btn.addToCart": "Add to Cart",
    "common.btn.buyNow": "Buy Now",
    "common.btn.viewAll": "View All",
    "common.btn.viewDetails": "View Details",
    "common.btn.continue": "Continue",
    "common.btn.cancel": "Cancel",
    "common.btn.save": "Save",
    "common.btn.saveChanges": "Save Changes",
    "common.btn.submit": "Submit",
    "common.btn.confirm": "Confirm",
    "common.btn.delete": "Delete",
    "common.btn.edit": "Edit",
    "common.btn.remove": "Remove",
    "common.btn.close": "Close",
    "common.btn.back": "Back",
    "common.btn.next": "Next",
    "common.btn.retry": "Retry",
    "common.btn.loadMore": "Load More",
    "common.btn.apply": "Apply",
    "common.btn.clear": "Clear All",

    /* Common — Status */
    "common.status.inStock": "In Stock",
    "common.status.outOfStock": "Out of Stock",
    "common.status.onlyLeft": "Only {count} left",
    "common.status.notifyMe": "Notify Me",
    "common.status.verified": "Verified",
    "common.status.pending": "Pending",
    "common.status.approved": "Approved",
    "common.status.rejected": "Rejected",

    /* Common — Misc */
    "common.currency.symbol": "₹",
    "common.currency.free": "FREE",
    "common.rating.stars": "{count} stars",
    "common.rating.reviews": "{count} reviews",
    "common.rating.basedOn": "based on {count} reviews",

    /* Navigation */
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.plants": "Plants",
    "nav.planters": "Planters",
    "nav.gardeningProducts": "Gardening Products",
    "nav.services": "Services",
    "nav.providers": "Gardeners",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.faq": "FAQ",
    "nav.account": "Account",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.wishlist": "Wishlist",
    "nav.cart": "Cart",
    "nav.search": "Search plants, planters, services...",
    "nav.becomeProvider": "Become a Provider",
    "nav.orders": "My Orders",
    "nav.bookings": "My Bookings",
    "nav.notifications": "Notifications",
    "nav.settings": "Settings",
    "nav.help": "Help",

    /* Footer */
    "footer.shop": "Shop",
    "footer.services": "Services",
    "footer.support": "Support",
    "footer.company": "Company",
    "footer.newsletter": "Subscribe to our newsletter",
    "footer.newsletter.placeholder": "Enter your email",
    "footer.newsletter.cta": "Subscribe",
    "footer.trustBadges": "Why shop with us",
    "footer.paymentMethods": "We accept",
    "footer.followUs": "Follow us",
    "footer.sitemap": "Sitemap",
    "footer.rights": "© {year} GrowPlants. All rights reserved.",

    /* Hero */
    "hero.title": "Bring home a little green",
    "hero.subtitle":
      "Shop healthy plants, premium planters, and gardening supplies — or book verified local gardeners in Sonipat.",
    "hero.ctaPrimary": "Shop Plants",
    "hero.ctaSecondary": "Book a Gardener",

    /* Trust */
    "trust.healthyPlants": "Healthy Plants",
    "trust.healthyPlants.desc": "Hand-picked and quality-checked before delivery",
    "trust.fastDelivery": "Fast Sonipat Delivery",
    "trust.fastDelivery.desc": "Free shipping on orders above ₹499",
    "trust.verifiedGardeners": "Verified Gardeners",
    "trust.verifiedGardeners.desc": "Background-checked, trained, and rated",
    "trust.easyReturns": "Easy Returns",
    "trust.easyReturns.desc": "24-hour damage window for plants, 7 days for planters",

    /* Shop */
    "shop.title": "Shop",
    "shop.results": "{count} results",
    "shop.filters": "Filters",
    "shop.sortBy": "Sort by",
    "shop.sort.featured": "Featured",
    "shop.sort.priceAsc": "Price: Low to High",
    "shop.sort.priceDesc": "Price: High to Low",
    "shop.sort.newest": "Newest First",
    "shop.sort.rating": "Best Rated",
    "shop.sort.bestseller": "Best Sellers",
    "shop.filter.category": "Category",
    "shop.filter.price": "Price",
    "shop.filter.rating": "Rating",
    "shop.filter.suitableFor": "Suitable For",
    "shop.filter.sunlight": "Sunlight Requirement",
    "shop.filter.difficulty": "Care Difficulty",
    "shop.filter.inStock": "In stock only",
    "shop.filter.petSafe": "Pet safe only",
    "shop.filter.clearAll": "Clear all filters",

    /* PDP */
    "pdp.addToCart": "Add to Cart",
    "pdp.buyNow": "Buy Now",
    "pdp.wishlist": "Add to Wishlist",
    "pdp.share": "Share",
    "pdp.care": "Care Instructions",
    "pdp.delivery": "Delivery & Returns",
    "pdp.description": "Description",
    "pdp.reviews": "Reviews",
    "pdp.relatedProducts": "Customers also bought",
    "pdp.recentlyViewed": "Recently viewed",
    "pdp.checkPincode": "Check delivery",
    "pdp.pincodePlaceholder": "Enter pincode",
    "pdp.writeReview": "Write a Review",

    /* Cart */
    "cart.title": "Your Cart",
    "cart.empty": "Your cart is empty",
    "cart.empty.desc": "Add plants, pots, or gardening essentials to get started.",
    "cart.empty.cta": "Shop Plants",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.discount": "Discount",
    "cart.tax": "Tax",
    "cart.total": "Total",
    "cart.freeShipping": "FREE",
    "cart.freeShipping.progress":
      "Add ₹{remaining} more for FREE shipping!",
    "cart.freeShipping.achieved": "🎉 You've unlocked FREE shipping!",
    "cart.coupon.placeholder": "Enter coupon code",
    "cart.coupon.apply": "Apply",
    "cart.checkout": "Proceed to Checkout",
    "cart.continueShopping": "Continue Shopping",
    "cart.clearCart": "Clear Cart",
    "cart.quantity": "Qty",
    "cart.removeItem": "Remove item",

    /* Checkout */
    "checkout.title": "Checkout",
    "checkout.step.address": "Address",
    "checkout.step.review": "Review",
    "checkout.step.payment": "Payment",
    "checkout.selectAddress": "Select delivery address",
    "checkout.addNewAddress": "Add new address",
    "checkout.pincodeNotServiceable": "Not deliverable to your area",
    "checkout.paymentMethod": "Payment method",
    "checkout.payment.razorpay": "Pay online (UPI / Card / Wallet)",
    "checkout.payment.cod": "Cash on Delivery",
    "checkout.codNotice": "COD available for orders up to ₹5,000",
    "checkout.placeOrder": "Place Order",
    "checkout.specialInstructions": "Special instructions (optional)",
    "checkout.estimatedDelivery": "Estimated delivery: {date}",
    "checkout.deliveryCharge": "Delivery charge",

    /* Order Confirmation */
    "order.confirmation.title": "Order placed!",
    "order.confirmation.thankYou": "Thank you for your order",
    "order.confirmation.number": "Order number: {orderId}",
    "order.confirmation.invoice": "Download Invoice",
    "order.confirmation.continue": "Continue Shopping",
    "order.confirmation.viewOrder": "View Order",
    "order.status.pending": "Pending",
    "order.status.confirmed": "Confirmed",
    "order.status.processing": "Processing",
    "order.status.outForDelivery": "Out for Delivery",
    "order.status.delivered": "Delivered",
    "order.status.cancelled": "Cancelled",

    /* Account */
    "account.dashboard": "Dashboard",
    "account.orders": "Orders",
    "account.bookings": "Bookings",
    "account.wishlist": "Wishlist",
    "account.addresses": "Addresses",
    "account.profile": "Profile",
    "account.settings": "Settings",
    "account.security": "Security",
    "account.reviews": "My Reviews",
    "account.welcome": "Welcome back, {name}",
    "account.memberSince": "Member since {date}",
    "account.stats.totalOrders": "Total Orders",
    "account.stats.activeOrders": "Active Orders",
    "account.stats.totalBookings": "Total Bookings",
    "account.stats.wishlistCount": "Wishlist Items",

    /* Services & Booking */
    "service.title": "Gardening Services",
    "service.bookNow": "Book Now",
    "service.getQuote": "Get Quote",
    "service.viewDetails": "View Details",
    "service.whatsIncluded": "What's included",
    "service.whatsExcluded": "Not included",
    "service.providers": "Available Gardeners",
    "service.reviews": "Service Reviews",
    "booking.title": "Book a Service",
    "booking.step.service": "Service",
    "booking.step.schedule": "Schedule",
    "booking.step.summary": "Summary",
    "booking.step.payment": "Payment",
    "booking.selectDate": "Select date",
    "booking.selectSlot": "Select time slot",
    "booking.notes": "Notes for the gardener (optional)",
    "booking.confirm": "Confirm Booking",
    "booking.advanceRequired": "Advance payment required",
    "booking.status.pending": "Pending",
    "booking.status.confirmed": "Confirmed",
    "booking.status.inProgress": "In Progress",
    "booking.status.completed": "Completed",
    "booking.status.cancelled": "Cancelled",

    /* Provider Portal */
    "provider.dashboard": "Dashboard",
    "provider.bookings": "Bookings",
    "provider.calendar": "Calendar",
    "provider.profile": "Profile",
    "provider.earnings": "Earnings",
    "provider.stats.todayBookings": "Today's Bookings",
    "provider.stats.upcoming": "Upcoming (7 days)",
    "provider.stats.weekEarnings": "This Week's Earnings",
    "provider.stats.monthEarnings": "This Month's Earnings",
    "provider.confirm": "Confirm Booking",
    "provider.start": "Start Service",
    "provider.complete": "Mark Completed",
    "provider.noShow": "Mark No-Show",
    "provider.uploadPhotos": "Upload completion photos",
    "provider.requestPayout": "Request Payout",

    /* Empty States */
    "empty.cart.title": "Your cart is empty",
    "empty.cart.desc": "Browse our healthy plants and premium planters to get started.",
    "empty.orders.title": "No orders yet",
    "empty.orders.desc": "When you place your first order, it will appear here.",
    "empty.bookings.title": "No bookings yet",
    "empty.bookings.desc": "Book a gardener and your bookings will show up here.",
    "empty.wishlist.title": "Your wishlist is empty",
    "empty.wishlist.desc": "Tap the heart on any product to save it here.",
    "empty.addresses.title": "No saved addresses",
    "empty.addresses.desc": "Add your first delivery address to get started.",
    "empty.reviews.title": "No reviews yet",
    "empty.reviews.desc": "After your order is delivered, you can write a review.",
    "empty.search.title": "No results for \"{query}\"",
    "empty.search.desc": "Try different keywords or browse popular categories.",

    /* Error States */
    "error.generic.title": "Something went wrong",
    "error.generic.desc": "Please try again. If the problem persists, contact support.",
    "error.notFound.title": "Page not found",
    "error.notFound.desc": "The page you're looking for doesn't exist or has moved.",
    "error.network.title": "Network error",
    "error.network.desc": "Check your internet connection and try again.",
    "error.unauthorized.title": "Please log in",
    "error.unauthorized.desc": "You need to be logged in to access this page.",

    /* Auth */
    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Log in to continue shopping",
    "auth.register.title": "Create your account",
    "auth.register.subtitle": "Join GrowPlants to shop and book services",
    "auth.forgotPassword": "Forgot password?",
    "auth.identifier": "Email or phone",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.fullName": "Full name",
    "auth.email": "Email",
    "auth.phone": "Phone number",
    "auth.acceptTerms": "I agree to the Terms & Conditions and Privacy Policy",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.registerCta": "Register",
    "auth.loginCta": "Login",
    "auth.forgot.title": "Reset your password",
    "auth.forgot.subtitle": "Enter your email or phone to receive a reset code",
    "auth.otp.title": "Enter verification code",
    "auth.otp.subtitle": "We've sent a 6-digit code to {target}",
    "auth.otp.resend": "Resend code",
    "auth.otp.resendIn": "Resend in {seconds}s",
    "auth.otp.verify": "Verify",

    /* Language */
    "language.toggle": "हिन्दी",
    "language.label.en": "English",
    "language.label.hi": "हिन्दी",
  },

  hi: {
    /* Brand */
    "brand.name": "ग्रोप्लांट्स",
    "brand.tagline": "सोनीपत में पौधे, प्लांटर और बागवानी सेवाएं",

    /* Common — Buttons */
    "common.btn.shopNow": "अभी खरीदें",
    "common.btn.bookService": "सेवा बुक करें",
    "common.btn.addToCart": "कार्ट में जोड़ें",
    "common.btn.buyNow": "अभी खरीदें",
    "common.btn.viewAll": "सभी देखें",
    "common.btn.viewDetails": "विवरण देखें",
    "common.btn.continue": "जारी रखें",
    "common.btn.cancel": "रद्द करें",
    "common.btn.save": "सहेजें",
    "common.btn.saveChanges": "बदलाव सहेजें",
    "common.btn.submit": "जमा करें",
    "common.btn.confirm": "पुष्टि करें",
    "common.btn.delete": "हटाएं",
    "common.btn.edit": "संपादित करें",
    "common.btn.remove": "निकालें",
    "common.btn.close": "बंद करें",
    "common.btn.back": "पीछे",
    "common.btn.next": "आगे",
    "common.btn.retry": "पुनः प्रयास",
    "common.btn.loadMore": "और देखें",
    "common.btn.apply": "लागू करें",
    "common.btn.clear": "सभी साफ करें",

    /* Common — Status */
    "common.status.inStock": "स्टॉक में",
    "common.status.outOfStock": "स्टॉक में नहीं",
    "common.status.onlyLeft": "केवल {count} बचे",
    "common.status.notifyMe": "मुझे सूचित करें",
    "common.status.verified": "सत्यापित",
    "common.status.pending": "लंबित",
    "common.status.approved": "स्वीकृत",
    "common.status.rejected": "अस्वीकृत",

    /* Common — Misc */
    "common.currency.symbol": "₹",
    "common.currency.free": "मुफ़्त",
    "common.rating.stars": "{count} स्टार",
    "common.rating.reviews": "{count} समीक्षाएं",
    "common.rating.basedOn": "{count} समीक्षाओं के आधार पर",

    /* Navigation */
    "nav.home": "होम",
    "nav.shop": "शॉप",
    "nav.plants": "पौधे",
    "nav.planters": "प्लांटर",
    "nav.gardeningProducts": "बागवानी उत्पाद",
    "nav.services": "सेवाएं",
    "nav.providers": "माली",
    "nav.about": "हमारे बारे में",
    "nav.contact": "संपर्क",
    "nav.faq": "सामान्य प्रश्न",
    "nav.account": "खाता",
    "nav.login": "लॉगिन",
    "nav.register": "रजिस्टर",
    "nav.logout": "लॉगआउट",
    "nav.wishlist": "विशलिस्ट",
    "nav.cart": "कार्ट",
    "nav.search": "पौधे, प्लांटर, सेवाएं खोजें...",
    "nav.becomeProvider": "प्रदाता बनें",
    "nav.orders": "मेरे ऑर्डर",
    "nav.bookings": "मेरी बुकिंग",
    "nav.notifications": "सूचनाएं",
    "nav.settings": "सेटिंग्स",
    "nav.help": "सहायता",

    /* Footer */
    "footer.shop": "शॉप",
    "footer.services": "सेवाएं",
    "footer.support": "सहायता",
    "footer.company": "कंपनी",
    "footer.newsletter": "हमारे न्यूज़लेटर की सदस्यता लें",
    "footer.newsletter.placeholder": "अपना ईमेल दर्ज करें",
    "footer.newsletter.cta": "सदस्यता लें",
    "footer.trustBadges": "हमारे साथ क्यों खरीदें",
    "footer.paymentMethods": "हम स्वीकार करते हैं",
    "footer.followUs": "फ़ॉलो करें",
    "footer.sitemap": "साइटमैप",
    "footer.rights": "© {year} ग्रोप्लांट्स। सर्वाधिकार सुरक्षित।",

    /* Hero */
    "hero.title": "घर लाएं थोड़ी हरियाली",
    "hero.subtitle":
      "स्वस्थ पौधे, प्रीमियम प्लांटर और बागवानी सामग्री खरीदें — या सोनीपत में सत्यापित माली बुक करें।",
    "hero.ctaPrimary": "पौधे खरीदें",
    "hero.ctaSecondary": "माली बुक करें",

    /* Trust */
    "trust.healthyPlants": "स्वस्थ पौधे",
    "trust.healthyPlants.desc": "डिलीवरी से पहले हाथ से चुने और जांचे गए",
    "trust.fastDelivery": "तेज़ सोनीपत डिलीवरी",
    "trust.fastDelivery.desc": "₹499 से ऊपर के ऑर्डर पर मुफ़्त शिपिंग",
    "trust.verifiedGardeners": "सत्यापित माली",
    "trust.verifiedGardeners.desc": "बैकग्राउंड जांच, प्रशिक्षित, और रेटेड",
    "trust.easyReturns": "आसान रिटर्न",
    "trust.easyReturns.desc": "पौधों के लिए 24 घंटे, प्लांटर के लिए 7 दिन",

    /* Shop */
    "shop.title": "शॉप",
    "shop.results": "{count} परिणाम",
    "shop.filters": "फ़िल्टर",
    "shop.sortBy": "क्रमबद्ध करें",
    "shop.sort.featured": "विशेष",
    "shop.sort.priceAsc": "मूल्य: कम से अधिक",
    "shop.sort.priceDesc": "मूल्य: अधिक से कम",
    "shop.sort.newest": "नवीनतम पहले",
    "shop.sort.rating": "सर्वोच्च रेटेड",
    "shop.sort.bestseller": "बेस्ट सेलर",
    "shop.filter.category": "श्रेणी",
    "shop.filter.price": "मूल्य",
    "shop.filter.rating": "रेटिंग",
    "shop.filter.suitableFor": "के लिए उपयुक्त",
    "shop.filter.sunlight": "धूप की आवश्यकता",
    "shop.filter.difficulty": "देखभाल कठिनाई",
    "shop.filter.inStock": "केवल स्टॉक में",
    "shop.filter.petSafe": "केवल पालतू-सुरक्षित",
    "shop.filter.clearAll": "सभी फ़िल्टर साफ करें",

    /* PDP */
    "pdp.addToCart": "कार्ट में जोड़ें",
    "pdp.buyNow": "अभी खरीदें",
    "pdp.wishlist": "विशलिस्ट में जोड़ें",
    "pdp.share": "साझा करें",
    "pdp.care": "देखभाल निर्देश",
    "pdp.delivery": "डिलीवरी और रिटर्न",
    "pdp.description": "विवरण",
    "pdp.reviews": "समीक्षाएं",
    "pdp.relatedProducts": "ग्राहकों ने यह भी खरीदा",
    "pdp.recentlyViewed": "हाल ही में देखे",
    "pdp.checkPincode": "डिलीवरी जांचें",
    "pdp.pincodePlaceholder": "पिनकोड दर्ज करें",
    "pdp.writeReview": "समीक्षा लिखें",

    /* Cart */
    "cart.title": "आपका कार्ट",
    "cart.empty": "आपका कार्ट खाली है",
    "cart.empty.desc": "शुरू करने के लिए पौधे, गमले, या बागवानी सामान जोड़ें।",
    "cart.empty.cta": "पौधे खरीदें",
    "cart.subtotal": "उप-योग",
    "cart.shipping": "शिपिंग",
    "cart.discount": "छूट",
    "cart.tax": "कर",
    "cart.total": "कुल",
    "cart.freeShipping": "मुफ़्त",
    "cart.freeShipping.progress": "मुफ़्त शिपिंग के लिए ₹{remaining} और जोड़ें!",
    "cart.freeShipping.achieved": "🎉 आपको मुफ़्त शिपिंग मिल गई!",
    "cart.coupon.placeholder": "कूपन कोड दर्ज करें",
    "cart.coupon.apply": "लागू करें",
    "cart.checkout": "चेकआउट पर जाएं",
    "cart.continueShopping": "खरीदारी जारी रखें",
    "cart.clearCart": "कार्ट साफ करें",
    "cart.quantity": "मात्रा",
    "cart.removeItem": "आइटम निकालें",

    /* Checkout */
    "checkout.title": "चेकआउट",
    "checkout.step.address": "पता",
    "checkout.step.review": "समीक्षा",
    "checkout.step.payment": "भुगतान",
    "checkout.selectAddress": "डिलीवरी पता चुनें",
    "checkout.addNewAddress": "नया पता जोड़ें",
    "checkout.pincodeNotServiceable": "आपके क्षेत्र में डिलीवरी नहीं होती",
    "checkout.paymentMethod": "भुगतान विधि",
    "checkout.payment.razorpay": "ऑनलाइन भुगतान (यूपीआई / कार्ड / वॉलेट)",
    "checkout.payment.cod": "कैश ऑन डिलीवरी",
    "checkout.codNotice": "₹5,000 तक के ऑर्डर पर कोड उपलब्ध",
    "checkout.placeOrder": "ऑर्डर दें",
    "checkout.specialInstructions": "विशेष निर्देश (वैकल्पिक)",
    "checkout.estimatedDelivery": "अनुमानित डिलीवरी: {date}",
    "checkout.deliveryCharge": "डिलीवरी शुल्क",

    /* Order Confirmation */
    "order.confirmation.title": "ऑर्डर दिया गया!",
    "order.confirmation.thankYou": "आपके ऑर्डर के लिए धन्यवाद",
    "order.confirmation.number": "ऑर्डर नंबर: {orderId}",
    "order.confirmation.invoice": "चालान डाउनलोड करें",
    "order.confirmation.continue": "खरीदारी जारी रखें",
    "order.confirmation.viewOrder": "ऑर्डर देखें",
    "order.status.pending": "लंबित",
    "order.status.confirmed": "पुष्टि की गई",
    "order.status.processing": "प्रसंस्करण",
    "order.status.outForDelivery": "डिलीवरी के लिए भेजा गया",
    "order.status.delivered": "डिलीवर हो गया",
    "order.status.cancelled": "रद्द",

    /* Account */
    "account.dashboard": "डैशबोर्ड",
    "account.orders": "ऑर्डर",
    "account.bookings": "बुकिंग",
    "account.wishlist": "विशलिस्ट",
    "account.addresses": "पते",
    "account.profile": "प्रोफ़ाइल",
    "account.settings": "सेटिंग्स",
    "account.security": "सुरक्षा",
    "account.reviews": "मेरी समीक्षाएं",
    "account.welcome": "वापसी पर स्वागत है, {name}",
    "account.memberSince": "सदस्य {date} से",
    "account.stats.totalOrders": "कुल ऑर्डर",
    "account.stats.activeOrders": "सक्रिय ऑर्डर",
    "account.stats.totalBookings": "कुल बुकिंग",
    "account.stats.wishlistCount": "विशलिस्ट आइटम",

    /* Services & Booking */
    "service.title": "बागवानी सेवाएं",
    "service.bookNow": "अभी बुक करें",
    "service.getQuote": "कोटेशन पाएं",
    "service.viewDetails": "विवरण देखें",
    "service.whatsIncluded": "क्या शामिल है",
    "service.whatsExcluded": "शामिल नहीं",
    "service.providers": "उपलब्ध माली",
    "service.reviews": "सेवा समीक्षाएं",
    "booking.title": "सेवा बुक करें",
    "booking.step.service": "सेवा",
    "booking.step.schedule": "अनुसूची",
    "booking.step.summary": "सारांश",
    "booking.step.payment": "भुगतान",
    "booking.selectDate": "तारीख चुनें",
    "booking.selectSlot": "समय स्लॉट चुनें",
    "booking.notes": "माली के लिए नोट्स (वैकल्पिक)",
    "booking.confirm": "बुकिंग की पुष्टि करें",
    "booking.advanceRequired": "अग्रिम भुगतान आवश्यक",
    "booking.status.pending": "लंबित",
    "booking.status.confirmed": "पुष्टि की गई",
    "booking.status.inProgress": "प्रगति पर",
    "booking.status.completed": "पूर्ण",
    "booking.status.cancelled": "रद्द",

    /* Provider Portal */
    "provider.dashboard": "डैशबोर्ड",
    "provider.bookings": "बुकिंग",
    "provider.calendar": "कैलेंडर",
    "provider.profile": "प्रोफ़ाइल",
    "provider.earnings": "कमाई",
    "provider.stats.todayBookings": "आज की बुकिंग",
    "provider.stats.upcoming": "आगामी (7 दिन)",
    "provider.stats.weekEarnings": "इस सप्ताह की कमाई",
    "provider.stats.monthEarnings": "इस महीने की कमाई",
    "provider.confirm": "बुकिंग की पुष्टि करें",
    "provider.start": "सेवा शुरू करें",
    "provider.complete": "पूर्ण चिह्नित करें",
    "provider.noShow": "अनुपस्थित चिह्नित करें",
    "provider.uploadPhotos": "पूर्णता फ़ोटो अपलोड करें",
    "provider.requestPayout": "भुगतान का अनुरोध",

    /* Empty States */
    "empty.cart.title": "आपका कार्ट खाली है",
    "empty.cart.desc": "शुरू करने के लिए हमारे स्वस्थ पौधे और प्रीमियम प्लांटर देखें।",
    "empty.orders.title": "अभी तक कोई ऑर्डर नहीं",
    "empty.orders.desc": "जब आप अपना पहला ऑर्डर देंगे, तब वह यहां दिखाई देगा।",
    "empty.bookings.title": "अभी तक कोई बुकिंग नहीं",
    "empty.bookings.desc": "माली बुक करें और आपकी बुकिंग यहां दिखाई देगी।",
    "empty.wishlist.title": "आपकी विशलिस्ट खाली है",
    "empty.wishlist.desc": "किसी भी उत्पाद पर हार्ट टैप करके उसे यहां सहेजें।",
    "empty.addresses.title": "कोई सहेजा पता नहीं",
    "empty.addresses.desc": "शुरू करने के लिए अपना पहला डिलीवरी पता जोड़ें।",
    "empty.reviews.title": "अभी तक कोई समीक्षा नहीं",
    "empty.reviews.desc": "ऑर्डर डिलीवर होने के बाद, आप समीक्षा लिख सकते हैं।",
    "empty.search.title": "\"{query}\" के लिए कोई परिणाम नहीं",
    "empty.search.desc": "अलग कीवर्ड आज़माएं या लोकप्रिय श्रेणियां देखें।",

    /* Error States */
    "error.generic.title": "कुछ गलत हुआ",
    "error.generic.desc": "कृपया पुनः प्रयास करें। यदि समस्या बनी रहे, तो सहायता से संपर्क करें।",
    "error.notFound.title": "पेज नहीं मिला",
    "error.notFound.desc": "आप जो पेज ढूंढ रहे हैं वह मौजूद नहीं है या स्थानांतरित हो गया है।",
    "error.network.title": "नेटवर्क त्रुटि",
    "error.network.desc": "अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।",
    "error.unauthorized.title": "कृपया लॉगिन करें",
    "error.unauthorized.desc": "इस पेज तक पहुंचने के लिए आपको लॉगिन करना होगा।",

    /* Auth */
    "auth.login.title": "वापसी पर स्वागत है",
    "auth.login.subtitle": "खरीदारी जारी रखने के लिए लॉगिन करें",
    "auth.register.title": "अपना खाता बनाएं",
    "auth.register.subtitle": "खरीदारी और सेवाएं बुक करने के लिए ग्रोप्लांट्स से जुड़ें",
    "auth.forgotPassword": "पासवर्ड भूल गए?",
    "auth.identifier": "ईमेल या फ़ोन",
    "auth.password": "पासवर्ड",
    "auth.confirmPassword": "पासवर्ड की पुष्टि करें",
    "auth.fullName": "पूरा नाम",
    "auth.email": "ईमेल",
    "auth.phone": "फ़ोन नंबर",
    "auth.acceptTerms": "मैं नियम और शर्तें तथा गोपनीयता नीति से सहमत हूं",
    "auth.noAccount": "खाता नहीं है?",
    "auth.hasAccount": "पहले से खाता है?",
    "auth.registerCta": "रजिस्टर",
    "auth.loginCta": "लॉगिन",
    "auth.forgot.title": "अपना पासवर्ड रीसेट करें",
    "auth.forgot.subtitle": "रीसेट कोड पाने के लिए अपना ईमेल या फ़ोन दर्ज करें",
    "auth.otp.title": "सत्यापन कोड दर्ज करें",
    "auth.otp.subtitle": "हमने {target} पर 6-अंकीय कोड भेजा है",
    "auth.otp.resend": "कोड पुनः भेजें",
    "auth.otp.resendIn": "{seconds} सेकंड में पुनः भेजें",
    "auth.otp.verify": "सत्यापित करें",

    /* Language */
    "language.toggle": "English",
    "language.label.en": "English",
    "language.label.hi": "हिन्दी",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

/* ---------- Store ---------- */

interface BilingualState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

/**
 * Interpolates {var} placeholders in a translation string.
 */
function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

export const useBilingual = create<BilingualState>()(
  persist(
    (set, get) => ({
      language: DEFAULT_LANGUAGE,
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () =>
        set((s) => ({ language: s.language === "en" ? "hi" : "en" })),
      t: (key, vars) => {
        const { language } = get();
        const dict = translations[language];
        const value = dict[key] ?? translations.en[key] ?? (key as string);
        return interpolate(value, vars);
      },
    }),
    {
      name: "growplants-language",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR-safe noop
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({ language: state.language }),
    }
  )
);

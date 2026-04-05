// Client
export { apiClient, ApiError, setAuthToken, clearAuthToken } from './client';
export { setTokenProvider } from './client';

// Types — User
export type { User, UserProfile } from './types/user';

// Types — Listing
export type {
  Listing,
  ListingWithImages,
  ListingImage,
  ListingAttribute,
  ListingStatus,
} from './types/listing';

// Types — Pro Store
export type {
  ProStoreApplication,
  ProStoreApplicationStatus,
  SellerType,
  EstimatedListings,
  SubmitProStoreApplicationData,
  ReviewProStoreApplicationData,
} from './types/proStore';

// Types — Order
export type {
  OrderStatus,
  SoldOrder,
  PurchasedOrder,
  OrderDetail,
  OrderParty,
  OrderReview,
  OrderDispute,
  OrderReturn,
  OrderCounts,
} from './types/order';

// Types — Offer
export type {
  OfferStatus,
  ReceivedOffer,
  MadeOffer,
  OfferCounts,
} from './types/offer';

// Endpoints — Pro Store
export {
  submitProStoreApplication,
  getApplicationStatus,
} from './endpoints/proStore';

// Endpoints — Admin
export {
  getProStoreApplications,
  getProStoreApplication,
  reviewProStoreApplication,
} from './endpoints/admin';

// Types — Listings (endpoints)
export type {
  GetMyListingsParams,
  GetMyListingsResponse,
  CreateListingData,
  UpdateListingData,
  BulkUpdateData,
} from './endpoints/listings';

// Endpoints — Listings
export {
  getMyListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  uploadListingImage,
  deleteListingImage,
  bulkUpdateListings,
  bulkDeleteListings,
} from './endpoints/listings';

// Types — Orders (endpoints)
export type {
  GetMySalesParams,
  GetMyPurchasesParams,
  MarkAsShippedData,
} from './endpoints/orders';

// Endpoints — Orders
export {
  getMySales,
  getMyPurchases,
  getOrder,
  markAsShipped,
  confirmReceipt,
  getOrderCounts,
} from './endpoints/orders';

// Types — Offers (endpoints)
export type {
  CounterOfferData,
} from './endpoints/offers';

// Endpoints — Offers
export {
  getReceivedOffers,
  getMyOffers,
  acceptOffer,
  declineOffer,
  counterOffer,
  acceptCounter,
  declineCounter,
  withdrawOffer,
  getOfferCounts,
  sendOfferToWatchers,
} from './endpoints/offers';

// Types — Message
export type {
  Conversation,
  ConversationDetail,
  Message,
  MessageCounts,
  SendMessagePayload,
  SocketMessage,
} from './types/message';

// Types — Messages (endpoints)
export type {
  GetMessagesResponse,
} from './endpoints/messages';

// Endpoints — Messages
export {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  markAllRead,
  getMessageCounts,
} from './endpoints/messages';

// Types — Payout
export type {
  Balance,
  StripeAccountStatus,
  StripeDashboardLink,
  StripeOnboardingLink,
  StripeCreateAccountResponse,
} from './types/payout';

// Types — Analytics
export type {
  AnalyticsPeriod,
  RevenueDataPoint,
  ListingPerformance,
  AnalyticsSummary,
} from './types/analytics';

// Endpoints — Payouts
export {
  getBalance,
  getStripeAccountStatus,
  getStripeDashboardLink,
  createStripeAccount,
  createOnboardingLink,
  getPayoutTransactions,
} from './endpoints/payouts';

// Types — Analytics (endpoints)
export type { AnalyticsRawData } from './endpoints/analytics';

// Endpoints — Analytics
export { fetchAnalyticsData } from './endpoints/analytics';

// Types — Settings
export type {
  ProStoreSettings,
  UpdateSettingsData,
} from './types/settings';

// Endpoints — Settings
export {
  getSettings,
  updateSettings,
  uploadAvatar,
} from './endpoints/settings';

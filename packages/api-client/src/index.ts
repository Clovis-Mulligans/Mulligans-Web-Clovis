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
  openDispute,
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

// Types — Auth
export type {
  LoginData,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  ForgotPasswordData,
  ResetPasswordData,
  VerifyEmailData,
  ResendVerificationData,
  ChangePasswordData,
  AuthProfileResponse,
} from './types/auth';

// Endpoints — Auth
export {
  login,
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getAuthProfile,
} from './endpoints/auth';

// Types — Search
export type {
  ListingWithSeller,
  SearchParams,
  SearchResponse,
  SearchSuggestion,
  SearchSuggestionsResponse,
} from './types/search';

// Endpoints — Search
export {
  searchListings,
  getSearchSuggestions,
  getFeaturedListings,
} from './endpoints/search';

// Types — Public User
export type {
  PublicProfile,
  PublicProfileResponse,
} from './types/userPublic';

// Endpoints — Users
export {
  getPublicProfile,
  updateMyProfile,
} from './endpoints/users';

// Types — Cart
export type {
  CartItem,
  CartResponse,
  AddToCartData,
} from './types/cart';

// Endpoints — Cart
export {
  getCart,
  getCartCount,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from './endpoints/cart';

// Types — Favourite
export type {
  Favourite,
  FavouritesResponse,
  FavouriteCheckResponse,
} from './types/favourite';

// Endpoints — Favourites
export {
  getFavourites,
  addFavourite,
  removeFavourite,
  checkFavourite,
} from './endpoints/favourites';

// Reviews
export { getUserReviews, getUserReviewStats } from './endpoints/reviews';
export type { ReviewData, ReviewsResponse, ReviewStats } from './endpoints/reviews';

// Users — new additions
export { getUserStats, getSellerStats, getUserListings, getUserSoldItems, reportUser, blockUser, unblockUser, isUserBlocked } from './endpoints/users';
export type { UserStats, SellerStats, UserListingsParams, UserListingsResponse, SoldItemsResponse } from './endpoints/users';

// Endpoints — Offers (additions)
export { createOffer, getOffer } from './endpoints/offers';

// Endpoints — Messages (additions)
export { createConversation } from './endpoints/messages';

// Endpoints — Listings (additions)
export { getSellerListings } from './endpoints/listings';

// Types — Notification
export type {
  Notification,
  NotificationsResponse,
} from './types/notification';

// Endpoints — Notifications
export {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './endpoints/notifications';
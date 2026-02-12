/**
 * Client-side analytics helper
 * Manages session persistence and provides a simple API for tracking events
 */

const SESSION_KEY = 'teed_session_id';
const SESSION_EXPIRY_KEY = 'teed_session_expiry';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session ID that persists across page loads
 * Sessions expire after 30 minutes of inactivity
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return Math.random().toString(36).substring(2, 8);
  }

  const now = Date.now();
  const existingSession = localStorage.getItem(SESSION_KEY);
  const expiryTime = localStorage.getItem(SESSION_EXPIRY_KEY);

  // Check if session exists and hasn't expired
  if (existingSession && expiryTime && now < parseInt(expiryTime, 10)) {
    // Extend the session
    localStorage.setItem(SESSION_EXPIRY_KEY, String(now + SESSION_DURATION_MS));
    return existingSession;
  }

  // Create new session
  const newSession = Math.random().toString(36).substring(2, 10);
  localStorage.setItem(SESSION_KEY, newSession);
  localStorage.setItem(SESSION_EXPIRY_KEY, String(now + SESSION_DURATION_MS));
  return newSession;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  eventType: string,
  eventData: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    const sessionId = getSessionId();
    const pageUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const referrer = typeof document !== 'undefined' ? document.referrer : undefined;

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        event_data: {
          ...eventData,
          page_url: pageUrl,
          referrer: referrer || undefined,
        },
        session_id: sessionId,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.log('[Analytics] Tracking failed:', error);
    return false;
  }
}

// Convenience methods for common events
export const analytics = {
  /**
   * Track a page view
   */
  pageViewed: (page: string, metadata?: Record<string, unknown>) =>
    trackEvent('page_viewed', { page, ...metadata }),

  /**
   * Track when a bag is viewed
   */
  bagViewed: (bagId: string, bagCode: string, ownerHandle: string) =>
    trackEvent('bag_viewed', { bag_id: bagId, bag_code: bagCode, owner_handle: ownerHandle }),

  /**
   * Track when a link is clicked
   */
  linkClicked: (linkId: string, itemId: string, bagId: string, url: string, linkType?: string) =>
    trackEvent('link_clicked', { link_id: linkId, item_id: itemId, bag_id: bagId, url, link_type: linkType }),

  /**
   * Track when a bag is saved/bookmarked
   */
  bagSaved: (bagId: string, bagCode: string, ownerHandle: string) =>
    trackEvent('bag_saved', { bag_id: bagId, bag_code: bagCode, owner_handle: ownerHandle }),

  /**
   * Track when a bag is unsaved
   */
  bagUnsaved: (bagId: string, bagCode: string) =>
    trackEvent('bag_unsaved', { bag_id: bagId, bag_code: bagCode }),

  /**
   * Track when a bag is cloned/copied
   */
  bagCloned: (sourceBagId: string, sourceBagCode: string, newBagId: string, newBagCode: string) =>
    trackEvent('bag_cloned', { source_bag_id: sourceBagId, source_bag_code: sourceBagCode, new_bag_id: newBagId, new_bag_code: newBagCode }),

  /**
   * Track when a bag is shared (copy link, QR, etc.)
   */
  bagShared: (bagId: string, bagCode: string, shareMethod: 'copy_link' | 'qr_code' | 'native_share') =>
    trackEvent('bag_shared', { bag_id: bagId, bag_code: bagCode, share_method: shareMethod }),

  /**
   * Track when a user follows another user
   */
  userFollowed: (followedUserId: string, followedHandle: string) =>
    trackEvent('user_followed', { followed_user_id: followedUserId, followed_handle: followedHandle }),

  /**
   * Track when a user unfollows another user
   */
  userUnfollowed: (unfollowedUserId: string, unfollowedHandle: string) =>
    trackEvent('user_unfollowed', { unfollowed_user_id: unfollowedUserId, unfollowed_handle: unfollowedHandle }),

  /**
   * Track when an item detail modal is opened
   */
  itemViewed: (itemId: string, itemName: string | null, bagId: string, bagCode: string) =>
    trackEvent('item_viewed', { item_id: itemId, item_name: itemName, bag_id: bagId, bag_code: bagCode }),

  /**
   * Track signup
   */
  userSignedUp: (method: 'email' | 'google' | 'apple') =>
    trackEvent('user_signed_up', { method }),

  /**
   * Track login
   */
  userLoggedIn: (method: 'email' | 'google' | 'apple') =>
    trackEvent('user_logged_in', { method }),

  /**
   * Track bag creation
   */
  bagCreated: (bagId: string, bagCode: string, title: string, isFirstBag: boolean) =>
    trackEvent('bag_created', { bag_id: bagId, bag_code: bagCode, title, is_first_bag: isFirstBag }),

  /**
   * Track item added to bag
   */
  itemAdded: (itemId: string, bagId: string, bagCode: string, method: 'text_search' | 'url' | 'photo' | 'paste' | 'copy') =>
    trackEvent('item_added', { item_id: itemId, bag_id: bagId, bag_code: bagCode, method }),

  /**
   * Track search performed
   */
  searchPerformed: (query: string, resultCount: number, tier: string) =>
    trackEvent('search_performed', { query, result_count: resultCount, tier }),

  /**
   * Track profile view
   */
  profileViewed: (profileId: string, profileHandle: string) =>
    trackEvent('profile_viewed', { profile_id: profileId, profile_handle: profileHandle }),

  /**
   * Track CTA click
   */
  ctaClicked: (ctaId: string, page: string, destination: string) =>
    trackEvent('cta_clicked', { cta_id: ctaId, page, destination }),

  /**
   * Track social link click on profile
   */
  socialLinkClicked: (platform: string, profileHandle: string) =>
    trackEvent('social_link_clicked', { platform, profile_handle: profileHandle }),

  /**
   * Track beta application
   */
  betaApplied: (applicationId: string, referralCode?: string, creatorType?: string) =>
    trackEvent('beta_applied', { application_id: applicationId, referral_code: referralCode, creator_type: creatorType }),

  /**
   * Track referral share
   */
  referralShared: (applicationId: string, shareMethod: string) =>
    trackEvent('referral_shared', { application_id: applicationId, share_method: shareMethod }),

  /**
   * Track settings saved
   */
  settingsSaved: (fieldsChanged: string[]) =>
    trackEvent('settings_saved', { fields_changed: fieldsChanged }),

  /**
   * Track item copied to another bag
   */
  itemCopiedToBag: (sourceItemId: string, targetBagCode: string, sourceBagCode?: string) =>
    trackEvent('item_copied_to_bag', { source_item_id: sourceItemId, target_bag_code: targetBagCode, source_bag_code: sourceBagCode }),

  /**
   * Track paste detection
   */
  pasteDetected: (url: string, classification: string, actionTaken: string) =>
    trackEvent('paste_detected', { url, classification, action_taken: actionTaken }),
};

export default analytics;

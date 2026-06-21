export const NEWSFEED_PLAYBACK_RATE_OPTIONS = ["0.5", "0.75", "1", "1.25", "1.5", "2"] as const;
export const NEWSFEED_PLAYBACK_RATE_STORAGE_KEY = "newsfeed.playbackRate";
export const NEWSFEED_WHEEL_THRESHOLD = 30;
export const NEWSFEED_WHEEL_THROTTLE_MS = 620;
export const NEWSFEED_SWIPE_THRESHOLD = 40;
export const NEWSFEED_SCROLL_DURATION_MS = 520;
export const NEWSFEED_NAV_COOLDOWN_MS = 620;

// Feed tracking strategies
export const NEWSFEED_INITIAL_PAGE_LIMIT = 8;
export const NEWSFEED_PREFETCH_REMAINING_THRESHOLD = 2;
export const NEWSFEED_MIN_VIEW_SECONDS = 1;
export const NEWSFEED_COMPLETION_RATIO = 0.9;

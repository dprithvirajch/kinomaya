import posthog from 'posthog-js';

export const initAnalytics = () => {
  const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
  
  if (!POSTHOG_KEY) {
    console.warn("Analytics Disabled: VITE_POSTHOG_KEY is missing from .env");
    return;
  }
  
  posthog.init(POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    autocapture: false, // Set to true if you want to track every click automatically
  });
};

export const trackEvent = (eventName, properties = {}) => {
  if (posthog.__loaded) {
    posthog.capture(eventName, properties);
  } else {
    // If not loaded (e.g. no key), we log for debugging
    console.debug(`[Analytics Mock] ${eventName}`, properties);
  }
};

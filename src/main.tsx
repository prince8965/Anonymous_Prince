import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// One-time cleanup of obsolete demo localStorage caches so user sees only real data
try {
  const CLEANUP_KEY = 'nearcircle._cleared_demo_v2'
  if (!window.localStorage.getItem(CLEANUP_KEY)) {
    const demoKeys = [
      'nearcircle.community_posts.v1',
      'nearcircle.post_comments.v1',
      'nearcircle.post_likes.v1',
      'nearcircle.events.v1',
      'nearcircle.communities.v1',
      'nearcircle.organizations.v1',
      'nearcircle.org_follows.v1',
      'nearcircle.rsvps.v1',
      'nearcircle.event_registrations.v1',
    ]
    demoKeys.forEach((key) => window.localStorage.removeItem(key))
    window.localStorage.setItem(CLEANUP_KEY, 'true')
  }
} catch {
  // Ignore storage exceptions
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

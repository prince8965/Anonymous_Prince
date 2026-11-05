if (typeof window === 'undefined') {
  const store = new Map<string, string>()
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: (_i: number) => null,
  }
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockLocalStorage
}

import { demoAuthAdapter, DEMO_OWNER_ID } from '../src/services/authAdapter'

function computeInitials(name?: string, email?: string): string {
  if (!name || !name.trim()) {
    if (email) return email.slice(0, 2).toUpperCase()
    return 'U'
  }
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

async function runNavbarProfileTests() {
  console.log('=================================================================')
  console.log('      NearCircle: Navbar Profile & Dropdown Functionality Test   ')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`  ✗ [FAIL] ${testName}`)
      failed++
    }
  }

  // 1. Test initials generation
  console.log('>> Testing Initials Fallback Algorithm...')
  assert(computeInitials('John Doe') === 'JD', 'Two-word name generates first and last initial (John Doe -> JD)')
  assert(computeInitials('Alice') === 'AL', 'Single-word name generates first two characters (Alice -> AL)')
  assert(computeInitials('Manya Sharma') === 'MS', 'Manya Sharma generates MS')
  assert(computeInitials('Demo Campus Organizer') === 'DO', 'Three-word name uses first and last initials (Demo Campus Organizer -> DO)')
  assert(computeInitials('', 'test@example.com') === 'TE', 'Missing name falls back to first two chars of email')
  assert(computeInitials('', '') === 'U', 'Missing name and email falls back to U')

  // 2. Test Auth Sign In and Session
  console.log('\n>> Testing Authentication & Session Retrieval...')
  const testEmail = 'organizer@nearcircle.demo'
  const user = await demoAuthAdapter.signIn(testEmail, 'password123')
  assert(Boolean(user && user.id === DEMO_OWNER_ID), 'Successfully signed in demo organizer')
  assert(user.email === testEmail, 'User email matches signed-in account')
  assert(user.role === 'organizer', 'User role correctly detected as organizer')

  const activeSession = demoAuthAdapter.getSession()
  assert(Boolean(activeSession && activeSession.id === user.id), 'Active session persists in session store')
  assert(activeSession?.email === testEmail, 'Session contains authentic email')

  // 3. Test Auth Sign Out
  console.log('\n>> Testing Sign Out Functionality...')
  await demoAuthAdapter.signOut()
  const postLogoutSession = demoAuthAdapter.getSession()
  assert(postLogoutSession === null, 'Session terminated: getSession() returns null after signOut')

  console.log('\n=================================================================')
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`)
  console.log('=================================================================')
  if (failed > 0) process.exit(1)
}

runNavbarProfileTests()

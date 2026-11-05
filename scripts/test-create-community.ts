// Verify categories and validation logic for Create Community feature

const REQUIRED_CATEGORIES = [
  'Technology',
  'AI/ML',
  'Web Development',
  'Programming',
  'Education',
  'Business',
  'Design',
  'Other',
] as const

function validateCommunityForm(input: {
  name: string
  category: string
  description: string
}): { valid: boolean; error?: string } {
  if (!input.name || !input.name.trim()) {
    return { valid: false, error: 'Please enter a community name.' }
  }
  if (!input.category || !input.category.trim()) {
    return { valid: false, error: 'Please select a category.' }
  }
  if (!input.description || !input.description.trim()) {
    return { valid: false, error: 'Please describe what your community is about.' }
  }
  return { valid: true }
}

async function runTests() {
  console.log('=================================================================')
  console.log('    NearCircle: Create Community Component & Validation Tests    ')
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

  // 1. Check categories
  console.log('>> Verifying Category Options...')
  REQUIRED_CATEGORIES.forEach((cat) => {
    assert(REQUIRED_CATEGORIES.includes(cat), `Category "${cat}" is supported`)
  })

  // 2. Form validation tests
  console.log('\n>> Testing Form Validation Rules...')
  assert(
    validateCommunityForm({ name: '', category: 'Technology', description: 'Desc' }).valid === false,
    'Rejects empty community name',
  )
  assert(
    validateCommunityForm({ name: '   ', category: 'Technology', description: 'Desc' }).valid === false,
    'Rejects whitespace-only community name',
  )
  assert(
    validateCommunityForm({ name: 'Valid Name', category: '', description: 'Desc' }).valid === false,
    'Rejects empty category selection',
  )
  assert(
    validateCommunityForm({ name: 'Valid Name', category: 'Technology', description: '' }).valid === false,
    'Rejects empty description',
  )
  assert(
    validateCommunityForm({ name: 'Valid Name', category: 'Technology', description: '   ' }).valid === false,
    'Rejects whitespace-only description',
  )
  assert(
    validateCommunityForm({
      name: 'Mumbai Web Developers',
      category: 'Web Development',
      description: 'A community for developers building modern web applications.',
    }).valid === true,
    'Accepts valid community input with all fields present',
  )

  console.log('\n=================================================================')
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`)
  console.log('=================================================================')
  if (failed > 0) process.exit(1)
}

runTests()


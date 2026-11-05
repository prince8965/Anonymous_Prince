// Mock localStorage environment for Node runner
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

import {
  createPost,
  createPostComment,
  deletePost,
  deletePostComment,
  followOrganization,
  getCommunityPosts,
  getOrganizations,
  getPostById,
  getPostComments,
  togglePostLike,
  unfollowOrganization,
  updatePost,
} from '../src/services'

async function runCommunityTests() {
  console.log('=================================================================')
  console.log('           NearCircle: Community Functionality Test Suite        ')
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

  try {
    // 1. Fetch initial posts
    console.log('>> Step 1: Fetching initial community feed posts...')
    const initialPosts = await getCommunityPosts({ tab: 'for-you', category: 'all' })
    assert(Array.isArray(initialPosts) && initialPosts.length > 0, 'Feed returns existing posts list')

    // 2. Tab and category filters
    console.log('\n>> Step 2: Testing feed filtering & sorting...')
    const techPosts = await getCommunityPosts({ tab: 'for-you', category: 'Technology' })
    assert(techPosts.every((p) => p.category === 'Technology'), 'Filter by category "Technology" works')

    const sortedPopular = await getCommunityPosts({ tab: 'for-you', sort: 'popular' })
    assert(sortedPopular.length > 0, 'Sorting by popular engagement score works')

    // 3. Create a new post
    console.log('\n>> Step 3: Creating a new community post...')
    const testPost = await createPost({
      content: 'Hello NearCircle LinkedIn layout test! Testing post creation, likes, and comments.',
      category: 'Technology',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    })
    assert(Boolean(testPost.id), `Post created with ID: ${testPost.id}`)
    assert(testPost.content.includes('LinkedIn layout test'), 'Post content persisted accurately')
    assert(testPost.category === 'Technology', 'Post category persisted')
    assert(Boolean(testPost.imageUrl), 'Post image URL persisted')

    // 4. Retrieve post by ID
    console.log('\n>> Step 4: Retrieving post by ID...')
    const fetchedPost = await getPostById(testPost.id)
    assert(Boolean(fetchedPost && fetchedPost.id === testPost.id), 'Successfully fetched post by ID')

    // 5. Update / Edit post
    console.log('\n>> Step 5: Updating / editing post content...')
    const updatedPost = await updatePost(testPost.id, {
      content: 'Updated content for NearCircle LinkedIn layout test! Verified editing works.',
      category: 'AI/ML',
    })
    assert(updatedPost.content.includes('Updated content'), 'Post content updated successfully')
    assert(updatedPost.category === 'AI/ML', 'Post category updated to AI/ML')

    // 6. Like and Unlike post
    console.log('\n>> Step 6: Testing like & unlike functionality...')
    const initialLikes = updatedPost.likesCount
    const likeRes = await togglePostLike(testPost.id)
    assert(likeRes.liked === true, 'Post liked successfully')
    assert(likeRes.count === initialLikes + 1, 'Likes count incremented')

    const unlikeRes = await togglePostLike(testPost.id)
    assert(unlikeRes.liked === false, 'Post unliked successfully')
    assert(unlikeRes.count === initialLikes, 'Likes count decremented back')

    // 7. Add Comment and Reply Comment
    console.log('\n>> Step 7: Adding comments to the post...')
    const comment1 = await createPostComment(testPost.id, 'Great community update, looks very professional!')
    assert(Boolean(comment1.id && comment1.postId === testPost.id), 'Root comment created successfully')

    const comment2 = await createPostComment(
      testPost.id,
      'Thanks for testing!',
      comment1.id,
      comment1.authorName,
    )
    assert(Boolean(comment2.parentId === comment1.id), 'Nested reply comment created with parentId')
    assert(comment2.replyToAuthor === comment1.authorName, 'Reply tags author correctly')

    // 8. Retrieve comments
    console.log('\n>> Step 8: Retrieving comments for post...')
    const commentsList = await getPostComments(testPost.id)
    assert(commentsList.length >= 2, `Retrieved ${commentsList.length} comments for post`)

    // 9. Delete comment
    console.log('\n>> Step 9: Deleting a comment...')
    await deletePostComment(comment2.id)
    const commentsAfterDelete = await getPostComments(testPost.id)
    assert(commentsAfterDelete.every((c) => c.id !== comment2.id), 'Deleted comment removed from list')

    // 10. Delete post
    console.log('\n>> Step 10: Deleting test post...')
    await deletePost(testPost.id)
    const postAfterDelete = await getPostById(testPost.id)
    assert(postAfterDelete === null, 'Post deleted successfully and no longer retrievable')

    // 11. Follow and unfollow organization
    console.log('\n>> Step 11: Testing organization follow/unfollow...')
    const orgs = await getOrganizations()
    assert(orgs.length > 0, `Retrieved ${orgs.length} organizations`)
    const targetOrg = orgs[0]
    const wasFollowing = targetOrg.isFollowing
    const initialFollowerCount = targetOrg.followerCount

    if (!wasFollowing) {
      await followOrganization(targetOrg.id)
      const orgsAfterFollow = await getOrganizations()
      const updatedOrg = orgsAfterFollow.find((o) => o.id === targetOrg.id)
      assert(Boolean(updatedOrg?.isFollowing), 'Organization marked as following')
      assert(updatedOrg?.followerCount === initialFollowerCount + 1, 'Follower count incremented')

      await unfollowOrganization(targetOrg.id)
      const orgsAfterUnfollow = await getOrganizations()
      const restoredOrg = orgsAfterUnfollow.find((o) => o.id === targetOrg.id)
      assert(!restoredOrg?.isFollowing, 'Organization unfollowed successfully')
      assert(restoredOrg?.followerCount === initialFollowerCount, 'Follower count decremented')
    } else {
      await unfollowOrganization(targetOrg.id)
      const orgsAfterUnfollow = await getOrganizations()
      const updatedOrg = orgsAfterUnfollow.find((o) => o.id === targetOrg.id)
      assert(!updatedOrg?.isFollowing, 'Organization unfollowed successfully')

      await followOrganization(targetOrg.id)
      const orgsAfterFollow = await getOrganizations()
      const restoredOrg = orgsAfterFollow.find((o) => o.id === targetOrg.id)
      assert(Boolean(restoredOrg?.isFollowing), 'Organization re-followed successfully')
    }

    console.log('\n=================================================================')
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`)
    console.log('=================================================================')
    if (failed > 0) process.exit(1)
  } catch (err) {
    console.error('Test execution error:', err)
    process.exit(1)
  }
}

runCommunityTests()

import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Category, Community, UserRole } from '../types'
import { authAdapter } from './authAdapter'
import { delay, notifyChange } from './bus'
import { readCommunities, readFollowedIds, writeCommunities, writeFollowedIds } from './db'

export interface CommunityWithState extends Community {
  isFollowing: boolean
  /** Member count including the current user's follow. */
  members: number
}

function withState(c: Community, followed: Set<string>): CommunityWithState {
  const isFollowing = followed.has(c.id)
  return { ...c, isFollowing, members: c.memberCount + (isFollowing ? 1 : 0) }
}

/** Backend equivalent: GET /communities */
export async function getCommunities(): Promise<CommunityWithState[]> {
  await delay(150)
  const followed = new Set(readFollowedIds())

  // If Supabase is configured, fetch live communities if table exists, fallback to local/seed
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const liveCommunities: Community[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          category: row.category as Category,
          memberCount: row.member_count ?? 1,
          localityId: row.locality_id ?? 'andheri',
          accent: row.accent ?? '#00F2FE',
          isDemo: false,
          creatorId: row.creator_id,
          creatorRole: row.creator_role as UserRole,
          creatorName: row.creator_name,
          createdAt: row.created_at,
        }))

        return liveCommunities.map((c) => withState(c, followed))
      }
    } catch {
      // fallback to store
    }
  }

  const all = readCommunities()
  return all.map((c) => withState(c, followed))
}

/** Backend equivalent: GET /communities/:id */
export async function getCommunityById(id: string): Promise<CommunityWithState | null> {
  await delay(150)
  const all = await getCommunities()
  return all.find((x) => x.id === id) ?? null
}

export interface CreateCommunityInput {
  name: string
  description: string
  category: Category
  localityId?: string
  accent?: string
}

/**
 * Creates a new community.
 * Can be created by participants, organizers, or admins.
 * Once created, it is visible to all users and organizations.
 */
export async function createCommunity(input: CreateCommunityInput): Promise<CommunityWithState> {
  await delay(200)
  const sessionUser = authAdapter.getSession()
  if (!sessionUser) {
    throw new Error('You must be signed in to create a community.')
  }

  const id = `com-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
  const newCommunity: Community = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    memberCount: 1, // creator is member 1
    localityId: input.localityId || 'andheri',
    accent: input.accent || '#00F2FE',
    isDemo: false,
    creatorId: sessionUser.id,
    creatorRole: sessionUser.role,
    creatorName: sessionUser.name,
    createdAt: new Date().toISOString(),
  }

  // 1. If Supabase is configured, save to database
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          id: newCommunity.id,
          name: newCommunity.name,
          description: newCommunity.description,
          category: newCommunity.category,
          locality_id: newCommunity.localityId,
          accent: newCommunity.accent,
          member_count: 1,
          creator_id: sessionUser.id,
          creator_role: sessionUser.role,
          creator_name: sessionUser.name,
        })
        .select()
        .maybeSingle()

      if (error) {
        console.warn('Supabase community insert note (using store fallback):', error.message)
      } else if (data) {
        newCommunity.id = data.id
      }
    } catch (e) {
      console.warn('Database note:', e)
    }
  }

  // 2. Persist in store so it is immediately available across the app
  const current = readCommunities()
  writeCommunities([newCommunity, ...current])

  // Automatically follow the community created by the user
  const followed = readFollowedIds()
  if (!followed.includes(newCommunity.id)) {
    writeFollowedIds([...followed, newCommunity.id])
  }

  notifyChange()

  return {
    ...newCommunity,
    isFollowing: true,
    members: 1,
  }
}

/** Backend equivalent: POST /communities/:id/follow */
export async function followCommunity(communityId: string): Promise<void> {
  await delay(150)
  const ids = readFollowedIds()
  if (!ids.includes(communityId)) {
    writeFollowedIds([...ids, communityId])
    notifyChange()
  }
}

/** Backend equivalent: DELETE /communities/:id/follow */
export async function unfollowCommunity(communityId: string): Promise<void> {
  await delay(150)
  writeFollowedIds(readFollowedIds().filter((id) => id !== communityId))
  notifyChange()
}

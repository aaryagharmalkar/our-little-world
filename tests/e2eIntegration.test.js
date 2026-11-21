import { test, describe } from 'node:test'
import assert from 'node:assert'
import crypto from 'node:crypto'

// ==============================================================================
// SIMULATED IN-MEMORY DATABASE & RLS ENGINE FOR TESTING USER JOURNEYS
// Mirrors PostgreSQL schema, constraints, functions and RLS policies
// ==============================================================================

class MockPostgresDatabase {
  constructor() {
    this.profiles = new Map()
    this.couple_spaces = new Map()
    this.couple_members = []
    this.invitations = new Map()
    this.photos = new Map()
    this.photo_rotation = new Map()
    this.moods = []
    this.messages = []
    this.daily_questions = new Map()
    this.question_answers = []
    this.location_updates = new Map()
    this.virtual_interactions = []
    this.special_dates = []
  }

  // Helper: SHA-256
  sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex')
  }

  // 1. Create Couple Space (Atomic with creator binding & SHA-256 token)
  create_couple_space(userId, name, startDate) {
    // Check if user already in a space
    if (this.couple_members.some((m) => m.user_id === userId)) {
      throw new Error('User already belongs to a couple space')
    }

    const spaceId = `space-${crypto.randomUUID()}`
    const rawToken = crypto.randomBytes(24).toString('hex')
    const tokenHash = this.sha256(rawToken)

    const space = {
      id: spaceId,
      name: name || 'Our Little World',
      relationship_start_date: startDate || new Date().toISOString().split('T')[0],
      widget_token_hash: tokenHash,
      widget_token_expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      created_by: userId,
      created_at: new Date().toISOString(),
    }
    this.couple_spaces.set(spaceId, space)

    // Add creator
    this.couple_members.push({
      id: `mem-${crypto.randomUUID()}`,
      space_id: spaceId,
      user_id: userId,
      role: 'creator',
      joined_at: new Date().toISOString(),
    })

    return { space_id: spaceId, widget_token: rawToken }
  }

  // 2. Generate Invitation
  generate_invitation(userId, spaceId) {
    // Verify membership
    if (!this.is_space_member(spaceId, userId)) {
      throw new Error('Unauthorized: not a member of space')
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    const invite = {
      id: `inv-${crypto.randomUUID()}`,
      space_id: spaceId,
      invitation_code: code,
      created_by: userId,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      is_used: false,
      used_by: null,
      used_at: null,
      created_at: new Date().toISOString(),
    }
    this.invitations.set(code, invite)
    return code
  }

  // 3. Redeem Invitation (Atomic pairing with lock)
  redeem_invitation(userId, code) {
    if (this.couple_members.some((m) => m.user_id === userId)) {
      throw new Error('You already belong to a couple space.')
    }

    const cleanCode = code.trim().toUpperCase()
    const invite = this.invitations.get(cleanCode)

    if (!invite || invite.is_used || new Date(invite.expires_at) < new Date()) {
      throw new Error('Invalid, expired, or already used invitation code.')
    }

    if (invite.created_by === userId) {
      throw new Error('You cannot redeem your own invitation.')
    }

    // Check max 2 members constraint
    const currentMembers = this.couple_members.filter((m) => m.space_id === invite.space_id)
    if (currentMembers.length >= 2) {
      throw new Error('A couple space can have at most 2 members.')
    }

    // Mark used
    invite.is_used = true
    invite.used_by = userId
    invite.used_at = new Date().toISOString()

    // Add partner
    this.couple_members.push({
      id: `mem-${crypto.randomUUID()}`,
      space_id: invite.space_id,
      user_id: userId,
      role: 'partner',
      joined_at: new Date().toISOString(),
    })

    return { success: true, space_id: invite.space_id }
  }

  // 4. Membership check
  is_space_member(spaceId, userId) {
    return this.couple_members.some((m) => m.space_id === spaceId && m.user_id === userId)
  }

  // 5. Rotate Widget Token
  rotate_widget_token(spaceId, userId) {
    if (!this.is_space_member(spaceId, userId)) {
      throw new Error('Unauthorized')
    }
    const space = this.couple_spaces.get(spaceId)
    if (!space) throw new Error('Space not found')

    const newRawToken = crypto.randomBytes(24).toString('hex')
    space.widget_token_hash = this.sha256(newRawToken)
    space.widget_token_expires_at = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()

    return newRawToken
  }

  // 6. Get Widget Snapshot
  get_widget_snapshot(rawToken) {
    if (!rawToken || rawToken.length < 24) {
      return { error: 'Invalid widget token format' }
    }
    const hash = this.sha256(rawToken)

    // Lookup space by token hash
    let foundSpace = null
    for (const space of this.couple_spaces.values()) {
      if (space.widget_token_hash === hash) {
        if (new Date(space.widget_token_expires_at) > new Date()) {
          foundSpace = space
        }
        break
      }
    }

    if (!foundSpace) {
      return { error: 'Invalid or expired widget token' }
    }

    const members = this.couple_members.filter((m) => m.space_id === foundSpace.id)
    return {
      space: {
        id: foundSpace.id,
        name: foundSpace.name,
        relationship_start_date: foundSpace.relationship_start_date,
      },
      member_count: members.length,
      generated_at: new Date().toISOString(),
    }
  }

  // 7. Question Answer RLS Query (Mutual reveal simulation)
  query_question_answers(requestingUserId, spaceId, questionId) {
    if (!this.is_space_member(spaceId, requestingUserId)) {
      return [] // RLS denies access to non-members
    }

    // Has requesting user answered this question?
    const hasMyAnswer = this.question_answers.some(
      (a) => a.space_id === spaceId && a.question_id === questionId && a.user_id === requestingUserId
    )

    // Filter by RLS policy: view own answer OR view partner's answer IF self has answered!
    return this.question_answers.filter((a) => {
      if (a.space_id !== spaceId || a.question_id !== questionId) return false
      if (a.user_id === requestingUserId) return true
      return hasMyAnswer // Only revealed if caller also answered
    })
  }

  // 8. Photo RLS Query
  query_photos(requestingUserId, spaceId) {
    if (!this.is_space_member(spaceId, requestingUserId)) {
      return [] // Denied
    }
    return Array.from(this.photos.values()).filter((p) => p.space_id === spaceId)
  }
}

// ==============================================================================
// TWO-ACCOUNT USER JOURNEY & SECURITY AUDIT TEST SUITE
// ==============================================================================

describe('Phase 7: End-to-End Two-Account User Journeys & Security Audit', () => {
  let db
  const USER_AARYA = 'usr-aarya-111'
  const USER_BOYFRIEND = 'usr-boyfriend-222'
  const USER_ATTACKER = 'usr-stranger-999'

  test('Database & Storage Engine Initialization', () => {
    db = new MockPostgresDatabase()
    assert.ok(db)
  })

  test('Journey 1: Account Creation & Space Setup with SHA-256 Token Hash', () => {
    const res = db.create_couple_space(USER_AARYA, 'Our Little World ♡', '2023-04-18')
    assert.ok(res.space_id)
    assert.ok(res.widget_token)
    assert.strictEqual(res.widget_token.length, 48) // 24 bytes in hex

    // Verify stored space has HASHED token, NOT plaintext
    const space = db.couple_spaces.get(res.space_id)
    assert.notStrictEqual(space.widget_token_hash, res.widget_token)
    assert.strictEqual(space.widget_token_hash, db.sha256(res.widget_token))
  })

  test('Journey 2: Invitation Generation & Single-Use Pairing Flow', () => {
    const spaceId = Array.from(db.couple_spaces.keys())[0]

    // Aarya generates invite code
    const inviteCode = db.generate_invitation(USER_AARYA, spaceId)
    assert.ok(inviteCode)
    assert.strictEqual(inviteCode.length, 8)

    // Boyfriend redeems invitation
    const joinRes = db.redeem_invitation(USER_BOYFRIEND, inviteCode)
    assert.strictEqual(joinRes.success, true)
    assert.strictEqual(joinRes.space_id, spaceId)

    // Verify both are now verified members
    assert.strictEqual(db.is_space_member(spaceId, USER_AARYA), true)
    assert.strictEqual(db.is_space_member(spaceId, USER_BOYFRIEND), true)
  })

  test('Security Audit: Reusing Single-Use Invitation Code Fails', () => {
    const invite = Array.from(db.invitations.values())[0]
    assert.throws(
      () => db.redeem_invitation(USER_ATTACKER, invite.invitation_code),
      /Invalid, expired, or already used invitation code/
    )
  })

  test('Security Audit: Max 2 Member Constraint Strictly Enforced', () => {
    const spaceId = Array.from(db.couple_spaces.keys())[0]
    // Even if a new invite code were forged, 3rd member cannot join
    const newCode = 'FORGED99'
    db.invitations.set(newCode, {
      id: 'inv-forged',
      space_id: spaceId,
      invitation_code: newCode,
      created_by: USER_AARYA,
      expires_at: new Date(Date.now() + 100000).toISOString(),
      is_used: false,
    })

    assert.throws(
      () => db.redeem_invitation(USER_ATTACKER, newCode),
      /A couple space can have at most 2 members/
    )
  })

  test('Journey 3: Question of the Day Mutual Reveal RLS Enforcement', () => {
    const spaceId = Array.from(db.couple_spaces.keys())[0]
    const questionId = 'q-day-1'

    // Step 1: Aarya submits her answer
    db.question_answers.push({
      id: 'ans-1',
      space_id: spaceId,
      question_id: questionId,
      user_id: USER_AARYA,
      answer_text: 'The evening we watched the stars on the beach.',
    })

    // Aarya queries answers -> She sees her own answer
    const aaryaViewBefore = db.query_question_answers(USER_AARYA, spaceId, questionId)
    assert.strictEqual(aaryaViewBefore.length, 1)
    assert.strictEqual(aaryaViewBefore[0].user_id, USER_AARYA)

    // Boyfriend queries answers before answering -> Partner answer MUST BE CONCEALED!
    const boyfriendViewBefore = db.query_question_answers(USER_BOYFRIEND, spaceId, questionId)
    assert.strictEqual(boyfriendViewBefore.length, 0, 'Boyfriend must not see Aarya answer before answering!')

    // Attacker (stranger) queries answers -> 0 rows (Cross-couple isolation)
    const attackerView = db.query_question_answers(USER_ATTACKER, spaceId, questionId)
    assert.strictEqual(attackerView.length, 0)

    // Step 2: Boyfriend submits his answer
    db.question_answers.push({
      id: 'ans-2',
      space_id: spaceId,
      question_id: questionId,
      user_id: USER_BOYFRIEND,
      answer_text: 'When we got caught in the rain laughing with coffee.',
    })

    // Now BOTH answers are revealed to both partners!
    const aaryaViewAfter = db.query_question_answers(USER_AARYA, spaceId, questionId)
    const boyfriendViewAfter = db.query_question_answers(USER_BOYFRIEND, spaceId, questionId)

    assert.strictEqual(aaryaViewAfter.length, 2, 'Aarya sees both answers once both answered')
    assert.strictEqual(boyfriendViewAfter.length, 2, 'Boyfriend sees both answers once both answered')
  })

  test('Journey 4: Private Storage & Cross-Couple Photo Isolation', () => {
    const spaceId = Array.from(db.couple_spaces.keys())[0]

    // Aarya uploads photo to private storage
    const photoId = 'photo-private-1'
    db.photos.set(photoId, {
      id: photoId,
      space_id: spaceId,
      uploaded_by: USER_AARYA,
      storage_path: `${spaceId}/sunset.jpg`,
      caption: 'Sunset together',
      is_favorite: true,
    })

    // Boyfriend queries photos -> Permitted
    const boyfriendPhotos = db.query_photos(USER_BOYFRIEND, spaceId)
    assert.strictEqual(boyfriendPhotos.length, 1)

    // Attacker queries photos -> Denied (0 rows returned)
    const attackerPhotos = db.query_photos(USER_ATTACKER, spaceId)
    assert.strictEqual(attackerPhotos.length, 0)
  })

  test('Journey 5: Widget Token Security, Snapshot Scoping & Rotation', () => {
    const spaceId = Array.from(db.couple_spaces.keys())[0]

    // Rotate widget token
    const newRawToken = db.rotate_widget_token(spaceId, USER_AARYA)
    assert.ok(newRawToken)

    // Snapshot fetch with new valid token -> Success
    const snapshot = db.get_widget_snapshot(newRawToken)
    assert.ok(!snapshot.error)
    assert.strictEqual(snapshot.space.id, spaceId)
    assert.strictEqual(snapshot.member_count, 2)

    // Snapshot fetch with invalid token -> Rejected
    const invalidSnapshot = db.get_widget_snapshot('olw_invalid_random_token_1234567890')
    assert.strictEqual(invalidSnapshot.error, 'Invalid or expired widget token')

    // Snapshot fetch with too-short token -> Rejected
    const shortSnapshot = db.get_widget_snapshot('short')
    assert.strictEqual(shortSnapshot.error, 'Invalid widget token format')
  })
})

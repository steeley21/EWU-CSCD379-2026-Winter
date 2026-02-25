<template>
  <div class="forum-wrap">
    <div class="forum-header">
      <div class="forum-header-left">
        <div class="forum-eyebrow">Community</div>
        <h2 class="forum-title">Group Forum</h2>
        <p class="forum-sub">Share thoughts, plan meetings, chat with your group</p>
      </div>
      <div class="forum-quill" aria-hidden="true">&#10022;</div>
    </div>

    <!-- Category Cards -->
    <div v-if="!activeCategory && !activePost" class="forum-categories">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="forum-cat-card"
        :style="`--cat-accent: ${cat.color}`"
        @click="openCategory(cat)"
      >
        <div class="forum-cat-icon" :style="`color: ${cat.color}`" v-html="cat.icon" />
        <div class="forum-cat-body">
          <div class="forum-cat-name">{{ cat.name }}</div>
          <div class="forum-cat-desc">{{ cat.description }}</div>
          <div class="forum-cat-meta">
            <span>{{ postCountFor(cat.id) }} posts</span>
            <span class="forum-cat-dot">·</span>
            <span>{{ lastActivityFor(cat.id) }}</span>
          </div>
        </div>
        <div class="forum-cat-arrow">›</div>
      </button>
    </div>

    <!-- Category View -->
    <div v-else-if="activeCategory && !activePost" class="forum-post-list-wrap">
      <div class="forum-nav-row">
        <button class="forum-back-btn" @click="activeCategory = null">
          &laquo; Back to Forum
        </button>
        <button class="forum-new-btn" @click="openNewPost">
          + New Post
        </button>
      </div>

      <div class="forum-cat-banner" :style="`--cat-accent: ${activeCategory.color}`">
        <span class="forum-cat-banner-icon" :style="`color: ${activeCategory.color}`" v-html="activeCategory.icon" />
        <div>
          <div class="forum-cat-banner-name">{{ activeCategory.name }}</div>
          <div class="forum-cat-banner-desc">{{ activeCategory.description }}</div>
        </div>
      </div>

      <v-progress-linear v-if="loadingPosts" indeterminate color="var(--camel)" class="mb-3" />

      <div v-else-if="postsError" class="forum-error">{{ postsError }}</div>

      <div v-else-if="posts.length === 0" class="forum-empty">
        <div class="forum-empty-icon">&#128218;</div>
        <div class="forum-empty-text">No posts yet - be the first!</div>
      </div>

      <div v-else class="forum-post-list">
        <button
          v-for="post in posts"
          :key="post.fpId"
          class="forum-post-row"
          @click="openPost(post)"
        >
          <div class="forum-post-avatar">{{ initials(post.authorName) }}</div>
          <div class="forum-post-main">
            <div class="forum-post-title">{{ post.title }}</div>
            <div class="forum-post-byline">
              {{ post.authorName }} · {{ timeAgo(post.createdAt) }}
            </div>
            <div v-if="post.preview" class="forum-post-preview">{{ post.preview }}</div>
          </div>
          <div class="forum-post-stats">
            <div class="forum-reply-badge">{{ post.replyCount }}</div>
            <div class="forum-reply-label">replies</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Thread View -->
    <div v-else-if="activePost" class="forum-thread-wrap">
      <div class="forum-nav-row">
        <button class="forum-back-btn" @click="closePost">
          &laquo; Back to {{ activeCategory?.name }}
        </button>
      </div>

      <div class="forum-thread-post">
        <div class="forum-thread-header">
          <div class="forum-post-avatar forum-post-avatar--lg">{{ initials(activePost.authorName) }}</div>
          <div>
            <div class="forum-thread-author">{{ activePost.authorName }}</div>
            <div class="forum-thread-time">{{ timeAgo(activePost.createdAt) }}</div>
          </div>
        </div>
        <h3 class="forum-thread-title">{{ activePost.title }}</h3>
        <div class="forum-thread-body">{{ activePost.body }}</div>
      </div>

      <div class="forum-replies-label">
        {{ activePost.replies.length }} {{ activePost.replies.length === 1 ? 'Reply' : 'Replies' }}
      </div>

      <div v-if="activePost.replies.length" class="forum-replies">
        <div
          v-for="(reply, i) in activePost.replies"
          :key="reply.frId"
          class="forum-reply"
          :style="`animation-delay: ${i * 0.04}s`"
        >
          <div class="forum-reply-avatar">{{ initials(reply.authorName) }}</div>
          <div class="forum-reply-body">
            <div class="forum-reply-meta">
              <span class="forum-reply-author">{{ reply.authorName }}</span>
              <span class="forum-reply-dot">·</span>
              <span class="forum-reply-time">{{ timeAgo(reply.createdAt) }}</span>
            </div>
            <div class="forum-reply-text">{{ reply.body }}</div>
          </div>
        </div>
      </div>

      <div v-else class="forum-empty forum-empty--sm">
        <div class="forum-empty-text">No replies yet. Start the conversation!</div>
      </div>

      <div class="forum-composer">
        <div class="forum-composer-avatar">{{ initials(currentUserName) }}</div>
        <div class="forum-composer-right">
          <textarea
            v-model="replyText"
            class="forum-composer-input"
            placeholder="Write a reply..."
            rows="3"
            :disabled="replySaving"
            @keydown.ctrl.enter="submitReply"
            @keydown.meta.enter="submitReply"
          />
          <div class="forum-composer-actions">
            <span class="forum-composer-hint">Ctrl+Enter to send</span>
            <button
              class="forum-submit-btn"
              :disabled="!replyText.trim() || replySaving"
              @click="submitReply"
            >
              {{ replySaving ? 'Sending...' : 'Reply' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Post Dialog -->
    <div v-if="newPostOpen" class="forum-overlay" @click.self="newPostOpen = false">
      <div class="forum-modal">
        <div class="forum-modal-header">
          <div class="forum-modal-title">New Post</div>
          <button class="forum-modal-close" @click="newPostOpen = false">&#x2715;</button>
        </div>
        <div class="forum-modal-body">
          <input
            v-model="newPostTitle"
            class="forum-field"
            placeholder="Post title..."
            maxlength="120"
          />
          <textarea
            v-model="newPostBody"
            class="forum-field forum-field--area"
            placeholder="What's on your mind?"
            rows="5"
          />
          <div v-if="newPostErr" class="forum-field-err">{{ newPostErr }}</div>
        </div>
        <div class="forum-modal-footer">
          <button class="forum-cancel-btn" @click="newPostOpen = false">Cancel</button>
          <button
            class="forum-submit-btn"
            :disabled="!newPostTitle.trim() || !newPostBody.trim() || postSaving"
            @click="submitNewPost"
          >
            {{ postSaving ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { forumService } from '~/services/forumService'
import type { ForumPostDto, ForumPostDetailDto } from '~/types/dtos'

interface ForumCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

const props = defineProps<{
  groupId: number
  currentUserName: string
}>()

const bookSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
const calSvg  = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="0.5" fill="currentColor"/><circle cx="12" cy="15" r="0.5" fill="currentColor"/><circle cx="16" cy="15" r="0.5" fill="currentColor"/></svg>'
const chatSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'

const categories: ForumCategory[] = [
  { id: 'book',    name: 'Book Discussion',    description: 'Themes, characters, favourite passages, hot takes', icon: bookSvg, color: '#6d4c3d' },
  { id: 'meeting', name: 'Meeting Discussion', description: 'Agenda, notes, follow-ups from your sessions',      icon: calSvg,  color: '#a39171' },
  { id: 'general', name: 'General',            description: 'Introductions, recommendations, anything goes',     icon: chatSvg, color: '#8a9e6a' },
]

// ── State ─────────────────────────────────────────────────────
const activeCategory = ref<ForumCategory | null>(null)
const activePost     = ref<ForumPostDetailDto | null>(null)
const posts          = ref<ForumPostDto[]>([])
const loadingPosts   = ref(false)
const postsError     = ref('')

const newPostOpen  = ref(false)
const newPostTitle = ref('')
const newPostBody  = ref('')
const newPostErr   = ref('')
const postSaving   = ref(false)

const replyText   = ref('')
const replySaving = ref(false)

// ── Computed helpers for category list ───────────────────────
// These use a local cache of all loaded posts for the count/activity display
const allLoadedPosts = ref<ForumPostDto[]>([])

function postCountFor(catId: string) {
  return allLoadedPosts.value.filter(p => p.category === catId).length
}

function lastActivityFor(catId: string) {
  const latest = allLoadedPosts.value
    .filter(p => p.category === catId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .at(0)

  if (!latest) return 'No posts yet'
  return timeAgo(latest.createdAt)
}

// ── Actions ───────────────────────────────────────────────────
async function openCategory(cat: ForumCategory) {
  activeCategory.value = cat
  activePost.value = null
  postsError.value = ''
  loadingPosts.value = true
  try {
    posts.value = await forumService.getPosts(props.groupId, cat.id)
    // merge into allLoadedPosts for the category-list stats
    allLoadedPosts.value = [
      ...allLoadedPosts.value.filter(p => p.category !== cat.id),
      ...posts.value,
    ]
  } catch (e: any) {
    postsError.value = e?.response?.data?.message ?? e?.message ?? 'Could not load posts.'
  } finally {
    loadingPosts.value = false
  }
}

async function openPost(post: ForumPostDto) {
  try {
    const detail = await forumService.getPost(props.groupId, activeCategory.value!.id, post.fpId)
    if (detail) {
      activePost.value = detail
      replyText.value = ''
    }
  } catch (e: any) {
    postsError.value = e?.response?.data?.message ?? e?.message ?? 'Could not load post.'
  }
}

function closePost() {
  activePost.value = null
  replyText.value = ''
}

function openNewPost() {
  newPostTitle.value = ''
  newPostBody.value = ''
  newPostErr.value = ''
  newPostOpen.value = true
}

async function submitNewPost() {
  if (!newPostTitle.value.trim() || !newPostBody.value.trim()) return
  newPostErr.value = ''
  postSaving.value = true
  try {
    await forumService.createPost(props.groupId, activeCategory.value!.id, {
      title: newPostTitle.value.trim(),
      body:  newPostBody.value.trim(),
    })
    // refresh list
    posts.value = await forumService.getPosts(props.groupId, activeCategory.value!.id)
    allLoadedPosts.value = [
      ...allLoadedPosts.value.filter(p => p.category !== activeCategory.value!.id),
      ...posts.value,
    ]
    newPostOpen.value = false
  } catch (e: any) {
    newPostErr.value = e?.response?.data?.message ?? e?.message ?? 'Could not create post.'
  } finally {
    postSaving.value = false
  }
}

async function submitReply() {
  if (!replyText.value.trim() || !activePost.value) return
  replySaving.value = true
  try {
    await forumService.createReply(
      props.groupId,
      activeCategory.value!.id,
      activePost.value.fpId,
      { body: replyText.value.trim() }
    )
    // refresh the thread
    const detail = await forumService.getPost(props.groupId, activeCategory.value!.id, activePost.value.fpId)
    if (detail) activePost.value = detail
    replyText.value = ''
  } catch (e: any) {
    console.error('Reply failed:', e)
  } finally {
    replySaving.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
function initials(name: string) {
  return (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function timeAgo(raw: string | Date) {
  const diff = Date.now() - new Date(raw).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(raw).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
 }

 // ── Load all posts on mount for category stats ────────────────
onMounted(async () => {
  const results = await Promise.allSettled(
    categories.map(cat => forumService.getPosts(props.groupId, cat.id))
  )
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const cat = categories[i]
      allLoadedPosts.value = [
        ...allLoadedPosts.value.filter(p => p.category !== cat.id),
        ...result.value,
      ]
    }
  })
})

</script>

<style scoped>
.forum-wrap {
  margin-top: 2rem;
  position: relative;
}
.forum-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.forum-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--camel);
  margin-bottom: 0.25rem;
}
.forum-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--coffee-bean);
  margin: 0 0 0.2rem;
  line-height: 1.1;
}
.forum-sub {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}
.forum-quill {
  font-size: 2rem;
  color: var(--pale-oak);
  line-height: 1;
  user-select: none;
  margin-top: 0.25rem;
}
.forum-categories {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.forum-cat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.2rem;
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border);
  border-radius: 18px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
  position: relative;
  overflow: hidden;
}
.forum-cat-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--cat-accent);
  border-radius: 4px 0 0 4px;
  opacity: 0.7;
  transition: opacity 0.18s, width 0.18s;
}
.forum-cat-card:hover {
  border-color: var(--cat-accent);
  box-shadow: 0 4px 20px rgba(109, 76, 61, 0.1);
  transform: translateY(-1px);
}
.forum-cat-card:hover::before { opacity: 1; width: 5px; }
.forum-cat-icon {
  flex-shrink: 0;
  width: 44px; height: 44px;
  display: grid;
  place-items: center;
  background: rgba(220, 201, 182, 0.3);
  border-radius: 12px;
}
.forum-cat-body { flex: 1; min-width: 0; }
.forum-cat-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--coffee-bean);
  margin-bottom: 0.15rem;
}
.forum-cat-desc {
  font-size: 0.84rem;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.forum-cat-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.forum-cat-dot { opacity: 0.4; }
.forum-cat-arrow {
  font-size: 1.4rem;
  color: var(--text-muted);
  transition: color 0.15s, transform 0.15s;
  flex-shrink: 0;
}
.forum-cat-card:hover .forum-cat-arrow {
  color: var(--cat-accent);
  transform: translateX(3px);
}
.forum-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.forum-back-btn {
  font-family: var(--font-body);
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.forum-back-btn:hover { color: var(--coffee-bean); }
.forum-new-btn {
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--bg);
  background: var(--coffee-bean);
  border: none;
  border-radius: var(--radius-pill);
  padding: 0.5rem 1.1rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.13s, box-shadow 0.15s;
  box-shadow: 0 3px 12px rgba(109, 76, 61, 0.2);
}
.forum-new-btn:hover {
  background: var(--camel);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(163, 145, 113, 0.35);
}
.forum-cat-banner {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1.1rem;
  background: rgba(220, 201, 182, 0.2);
  border: 1.5px solid var(--cat-accent);
  border-radius: 16px;
  margin-bottom: 1.1rem;
}
.forum-cat-banner-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.forum-cat-banner-name {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--coffee-bean);
  font-size: 1rem;
}
.forum-cat-banner-desc { font-size: 0.83rem; color: var(--text-muted); }
.forum-post-list { display: flex; flex-direction: column; gap: 0.6rem; }
.forum-post-row {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.13s;
}
.forum-post-row:hover {
  border-color: var(--camel);
  box-shadow: 0 4px 16px rgba(109, 76, 61, 0.09);
  transform: translateY(-1px);
}
.forum-post-avatar {
  flex-shrink: 0;
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--camel), var(--coffee-bean));
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  display: grid;
  place-items: center;
  letter-spacing: 0.02em;
}
.forum-post-avatar--lg { width: 46px; height: 46px; font-size: 0.85rem; }
.forum-post-main { flex: 1; min-width: 0; }
.forum-post-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.97rem;
  color: var(--coffee-bean);
  margin-bottom: 0.18rem;
}
.forum-post-byline { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.3rem; }
.forum-post-preview {
  font-size: 0.83rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.forum-post-stats {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.forum-reply-badge {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(220, 201, 182, 0.5);
  color: var(--coffee-bean);
  font-weight: 800;
  font-size: 0.78rem;
  display: grid;
  place-items: center;
}
.forum-reply-label { font-size: 0.65rem; color: var(--text-muted); }
.forum-thread-post {
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border);
  border-radius: 20px;
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.25rem;
}
.forum-thread-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}
.forum-thread-author {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--coffee-bean);
}
.forum-thread-time { font-size: 0.78rem; color: var(--text-muted); }
.forum-thread-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--coffee-bean);
  margin: 0 0 0.75rem;
  line-height: 1.3;
}
.forum-thread-body {
  font-size: 0.93rem;
  color: var(--text-body, #3d2b1f);
  line-height: 1.7;
  white-space: pre-wrap;
}
.forum-replies-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}
.forum-replies { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; }
.forum-reply {
  display: flex;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: rgba(220, 201, 182, 0.12);
  border: 1px solid var(--border);
  border-radius: 14px;
  animation: fadeSlideIn 0.22s ease both;
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.forum-reply-avatar {
  flex-shrink: 0;
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c4b49a, var(--coffee-bean));
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  display: grid;
  place-items: center;
}
.forum-reply-body { flex: 1; }
.forum-reply-meta {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  margin-bottom: 0.3rem;
}
.forum-reply-author { font-weight: 700; font-size: 0.84rem; color: var(--coffee-bean); }
.forum-reply-dot { color: var(--text-muted); font-size: 0.8rem; }
.forum-reply-time { font-size: 0.78rem; color: var(--text-muted); }
.forum-reply-text {
  font-size: 0.88rem;
  color: var(--text-body, #3d2b1f);
  line-height: 1.65;
  white-space: pre-wrap;
}
.forum-composer {
  display: flex;
  gap: 0.75rem;
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border);
  border-radius: 18px;
  padding: 1rem 1.1rem;
}
.forum-composer-avatar {
  flex-shrink: 0;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--camel), var(--coffee-bean));
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  display: grid;
  place-items: center;
}
.forum-composer-right { flex: 1; }
.forum-composer-input {
  width: 100%;
  resize: vertical;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-body, #3d2b1f);
  line-height: 1.6;
  padding: 0;
}
.forum-composer-input::placeholder { color: var(--text-muted); opacity: 0.7; }
.forum-composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.6rem;
}
.forum-composer-hint { font-size: 0.75rem; color: var(--text-muted); opacity: 0.6; }
.forum-submit-btn {
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--bg);
  background: var(--coffee-bean);
  border: none;
  border-radius: var(--radius-pill);
  padding: 0.48rem 1.1rem;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s, transform 0.12s;
  box-shadow: 0 2px 10px rgba(109, 76, 61, 0.2);
}
.forum-submit-btn:hover:not(:disabled) { background: var(--camel); transform: translateY(-1px); }
.forum-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.forum-cancel-btn {
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 0.48rem 1rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.forum-cancel-btn:hover { border-color: var(--camel); color: var(--coffee-bean); }
.forum-empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--text-muted);
}
.forum-empty--sm { padding: 1.25rem; }
.forum-empty-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.forum-empty-text { font-size: 0.88rem; }
.forum-error {
  color: #b94a48;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
  font-size: 0.88rem;
}
.forum-overlay {
  position: fixed;
  inset: 0;
  background: rgba(40, 20, 10, 0.45);
  backdrop-filter: blur(3px);
  z-index: 300;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.forum-modal {
  background: var(--bg, #fdf8f4);
  border: 1.5px solid var(--border);
  border-radius: 22px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(40, 20, 10, 0.25);
  overflow: hidden;
}
.forum-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.4rem 0.75rem;
  border-bottom: 1px solid var(--border);
}
.forum-modal-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--coffee-bean);
}
.forum-modal-close {
  background: transparent;
  border: none;
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.15s;
}
.forum-modal-close:hover { color: var(--coffee-bean); }
.forum-modal-body {
  padding: 1.1rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.forum-modal-footer {
  padding: 0.9rem 1.4rem 1.2rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  border-top: 1px solid var(--border);
}
.forum-field {
  width: 100%;
  background: rgba(220, 201, 182, 0.15);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 0.7rem 0.9rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-body, #3d2b1f);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  resize: vertical;
  box-sizing: border-box;
}
.forum-field:focus {
  border-color: var(--camel);
  box-shadow: 0 0 0 3px rgba(163, 145, 113, 0.15);
}
.forum-field::placeholder { color: var(--text-muted); opacity: 0.65; }
.forum-field--area { min-height: 110px; }
.forum-field-err {
  font-size: 0.82rem;
  color: #b94a48;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
}
</style>
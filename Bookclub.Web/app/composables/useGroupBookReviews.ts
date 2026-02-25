// app/composables/useGroupBookReviews.ts
import type { GroupBookReviewDto, UpsertGroupBookReviewDto } from '~/types/dtos'
import { reviewsService } from '~/services/reviewsService'
import { useAuthStore } from '~/stores/authStore'

export function useGroupBookReviews() {
  const auth = useAuthStore()

  const reviews = ref<GroupBookReviewDto[]>([])
  const loading = ref(false)
  const error = ref('')

  const myReview = computed(() => {
    const uid = auth.userId
    if (!uid) return null
    return reviews.value.find(r => r.userId === uid) ?? null
  })

  const otherReviews = computed(() => {
    const uid = auth.userId
    if (!uid) return reviews.value
    return reviews.value.filter(r => r.userId !== uid)
  })

  function reset() {
    reviews.value = []
    loading.value = false
    error.value = ''
  }

  async function load(groupId: number, gbId: number) {
    loading.value = true
    error.value = ''
    try {
      reviews.value = await reviewsService.getReviews(groupId, gbId)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? e?.message ?? 'Could not load reviews.'
    } finally {
      loading.value = false
    }
  }

  async function saveMine(groupId: number, gbId: number, payload: UpsertGroupBookReviewDto) {
    error.value = ''
    const saved = await reviewsService.upsertMyReview(groupId, gbId, payload)

    const idx = reviews.value.findIndex(r => r.userId === saved.userId && r.gbId === saved.gbId)
    if (idx >= 0) reviews.value[idx] = saved
    else reviews.value.unshift(saved)

    return saved
  }

  async function deleteMine(groupId: number, gbId: number) {
    error.value = ''
    await reviewsService.deleteMyReview(groupId, gbId)
    const uid = auth.userId
    reviews.value = reviews.value.filter(r => !(r.gbId === gbId && r.userId === uid))
  }

  async function moderateDelete(groupId: number, gbId: number, reviewId: number) {
    error.value = ''
    await reviewsService.deleteReview(groupId, gbId, reviewId)
    reviews.value = reviews.value.filter(r => r.reviewId !== reviewId)
  }

  return {
    reviews,
    loading,
    error,
    myReview,
    otherReviews,
    reset,
    load,
    saveMine,
    deleteMine,
    moderateDelete,
  }
}
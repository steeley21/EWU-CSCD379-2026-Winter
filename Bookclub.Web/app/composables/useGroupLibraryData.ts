// app/composables/useGroupLibraryData.ts
import { groupsService } from '~/services/groupsService'
import type { BookDto, GroupBookDto, GroupScheduleDto, GroupSummaryDto } from '~/types/dtos'
import { buildScheduleIndex } from '~/utils/groupLibrary'

export function useGroupLibraryData() {
  const group = ref<GroupSummaryDto | null>(null)
  const groupBooks = ref<GroupBookDto[]>([])
  const schedule = ref<GroupScheduleDto[]>([])

  const loading = ref(true)
  const pageError = ref('')

  const books = computed<BookDto[]>(() => groupBooks.value.map(gb => gb.book))

  const scheduleByBookId = computed(() => buildScheduleIndex(schedule.value))

  function scheduledDates(bookId: number): string[] {
    return scheduleByBookId.value.get(Number(bookId)) ?? []
  }

  async function loadAll(groupId: number) {
    loading.value = true
    pageError.value = ''

    try {
      const g = await groupsService.getById(groupId)
      if (!g) {
        group.value = null
        pageError.value = 'Group not found.'
        loading.value = false
        return
      }
      group.value = g
    } catch {
      pageError.value = 'Could not load group.'
    }

    const results = await Promise.allSettled([
      groupsService.getGroupBooks(groupId),
      groupsService.getSchedule(groupId),
    ])

    if (results[0].status === 'fulfilled') groupBooks.value = results[0].value
    else pageError.value = pageError.value || 'Could not load group books.'

    if (results[1].status === 'fulfilled') schedule.value = results[1].value

    loading.value = false
  }

  return {
    group,
    books,
    loading,
    pageError,
    scheduledDates,
    loadAll,
  }
}
// plugins/api.ts
import { setApiBaseUrl } from '~/services/api'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  setApiBaseUrl(config.public.apiBase as string)
})
import { For, Show, createResource, createSignal } from 'solid-js'
import { ListItem } from '../components/ListItem'
import { DecisionLog } from '../types/DecisionLog'
import { DataProvider, useData } from '../components/DataContext'

import GearIcon from '../assets/gear-icon.svg'
import RefreshIcon from '../assets/refresh-icon.svg'
import { backend_url } from '../utils/backend_url'
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from '~/components/ui/dialog'
import { TextField, TextFieldInput, TextFieldLabel } from '~/components/ui/text-field'
import { Button } from '~/components/ui/button'
import { throttle } from '@solid-primitives/scheduled'

export const DecisionLogs = () => {
  const { applicationSettings, setApplicationSettings } = useData()
  const [search, setDirectSearch] = createSignal('')
  const [apiSearch, setApiSearch] = createSignal(search())
  const setThrottledSearch = throttle(setApiSearch, 250)

  const [decisionLogs, actions] = createResource<DecisionLog[], string>(
    apiSearch,
    async (searchQuery) => {
      const url = new URL(`${backend_url}/api/decision-log/list`)
      if (searchQuery !== '') {
        url.searchParams.set('search', searchQuery)
      }

      const res = await fetch(url)
      return (await res.json()) as DecisionLog[]
    },
  )

  return (
    <DataProvider>
      <div class="h-full gap-2">
        <header class="h-14 flex justify-between items-center">
          <h1 class="text-2xl p-2">Decision Logs</h1>
          <div class="items-center flex gap-1.5 pr-2">
            <Dialog>
              <DialogTrigger as={Button}>
                <GearIcon class="w-5 h-5 stroke-background" />
                <span class="px-3">Settings</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription class="flex flex-col gap-4">
                    <TextField
                      value={applicationSettings.opa_server_url}
                      onChange={(e) => setApplicationSettings('opa_server_url', e)}
                    >
                      <TextFieldLabel for="opa_server_url">OPA Server URL</TextFieldLabel>
                      <TextFieldInput id="opa_server_url" type="text" />
                    </TextField>

                    <DialogClose as={Button}>Done</DialogClose>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Button onClick={actions.refetch}>
              <RefreshIcon class="w-5 h-5 stroke-background" />
              <span class="px-3">Refresh</span>
            </Button>
          </div>
        </header>
        <div class="max-w-md px-2 mb-4">
          <TextField
            value={search()}
            onChange={(e) => {
              setDirectSearch(e)
              setThrottledSearch(e)
            }}
          >
            <TextFieldLabel for="search">Search</TextFieldLabel>
            <TextFieldInput id="search" type="text" />
          </TextField>
        </div>
        <ul role="list" class="relative flex flex-col divide-y divide-gray-100">
          <Show when={decisionLogs.loading && !decisionLogs.error}>
            <li class="px-2">Loading...</li>
          </Show>
          <For each={decisionLogs()} fallback={<li class="px-2">No decision logs yet</li>}>
            {(log) => <ListItem item={log} />}
          </For>
        </ul>
      </div>
    </DataProvider>
  )
}

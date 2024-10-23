import { Accessor, For, JSX, Match, Setter, Show, Switch, createSignal } from 'solid-js'
import { useNavigate } from '@solidjs/router'

import { MonacoDiffEditor, MonacoEditor } from '../lib/solid-monaco'

import ReplayIcon from '../assets/replay-icon.svg'
import { useData } from './DataContext'
import { DecisionLog } from '../types/DecisionLog'
import { Bundle, BundleResponse } from '../types/Bundle'

import ChevronRight from '../assets/chevron-right.svg'
import ChevronDown from '../assets/chevron-down.svg'
import XIcon from '../assets/x.svg'
import { backend_url } from '../utils/backend_url'

type ListItemProps = DecisionLog & {
  bundle?: Bundle
  is_error?: boolean
}

async function fetchRevisionBundle(revisionId: string) {
  const res = await fetch(`${backend_url}/api/revisions/${revisionId}`)
  return (await res.json()) as BundleResponse
}

const Tabs = ['Input', 'Bundle', 'Result'] as const
type Tabs = (typeof Tabs)[number]

export const ListItem = (props: {
  item: ListItemProps
  previousItem?: ListItemProps
  local?: boolean
}) => {
  const [open, setOpen] = createSignal(false)
  const [tab, setTab] = createSignal<Tabs>('Input')
  const { setNewBundle, setLocalHistory } = useData()
  const navigate = useNavigate()

  if (props.previousItem !== undefined && props.item.bundle !== props.previousItem.bundle) {
    setTab('Bundle')
  }

  return (
    <li
      class={`py-3 hover:bg-gray-50 flex relative overflow-y-scroll flex-col ${open() && 'h-full'}`}
    >
      <div class="flex justify-between" onClick={() => setOpen(!open())}>
        <div class="flex items-center">
          <Show when={!open()} fallback={<ChevronDown class="w-5 h-5 ml-2" />}>
            <ChevronRight class="w-5 h-5 ml-2" />
          </Show>
          <Status item={props.item} />
          <Show when={props.item.bundle}>
            <ReplayButton
              onClick={(e) => {
                e.stopPropagation()

                setNewBundle(props.item.bundle!, props.item.input)
                navigate('/play')
              }}
            />
          </Show>
          <Show when={props.item.revision_id !== undefined}>
            <ReplayButton
              onClick={async (e) => {
                e.stopPropagation()

                const bundle = await fetchRevisionBundle(props.item.revision_id!)
                setNewBundle(bundle.files, props.item.input)
                navigate('/play')
              }}
            />
          </Show>
          <span class="text-sm mr-2">{new Date(props.item.timestamp).toUTCString()}</span>
          <Show when={props.item.path !== ''}>
            <span class="text-sm mr-2">{props.item.path}</span>
          </Show>
          <span class="text-sm mr-2">{props.item.decision_id}</span>
        </div>
        <div class="px-2 flex items-center">
          <Show when={props.local}>
            <button
              class="align-self-end p-2 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation()
                setLocalHistory((history) =>
                  history.filter((item) => item.decision_id !== props.item.decision_id),
                )
              }}
            >
              <XIcon class="w-5 h-5" />
            </button>
          </Show>
        </div>
      </div>

      <Show when={open()}>
        <TabBar tab={tab} setTab={setTab} hasPolicy={props.item.bundle !== undefined} />
        <Switch>
          <Match when={tab() === 'Input'}>
            <SmallEditor
              value={JSON.stringify(JSON.parse(props.item.input), null, 2)}
              previousValue={
                props.previousItem && props.previousItem.input != ''
                  ? JSON.stringify(JSON.parse(props.previousItem.input), null, 2)
                  : undefined
              }
              language="json"
            />
          </Match>
          <Match when={tab() === 'Result'}>
            <SmallEditor
              value={JSON.stringify(JSON.parse(props.item.result), null, 2)}
              previousValue={
                props.previousItem
                  ? JSON.stringify(JSON.parse(props.previousItem.result), null, 2)
                  : undefined
              }
              language="json"
            />
          </Match>
          <Show when={() => tab() === 'Bundle' && props.item.bundle !== undefined}>
            <Match when={tab() === 'Bundle'}>
              <BundleBar bundle={props.item.bundle!} previousBundle={props.previousItem?.bundle}>
                {([filename, content]) => (
                  <SmallEditor
                    value={props.item.bundle![filename]}
                    previousValue={props.previousItem?.bundle?.[filename]}
                    language="rego"
                  />
                )}
              </BundleBar>
            </Match>
          </Show>
        </Switch>
      </Show>
    </li>
  )
}

const ReplayButton = (props: {
  onClick: (
    e: MouseEvent & {
      currentTarget: HTMLButtonElement
      target: Element
    },
  ) => void
}) => {
  return (
    <button
      onClick={props.onClick}
      class="px-2 py-1 text-white hover:bg-slate-600 bg-slate-300 rounded mx-4"
    >
      <ReplayIcon class="w-7 h-7" />
    </button>
  )
}

const BundleBar = (props: {
  bundle: Bundle
  previousBundle?: Bundle
  children: (props: [filename: string, content: string]) => JSX.Element
}) => {
  const [bundleFile, setBundleFile] = createSignal(Object.keys(props.bundle)[0])

  if (
    props.previousBundle !== undefined &&
    Object.keys(props.previousBundle).every((key) => key in props.bundle)
  ) {
    setBundleFile(
      Object.keys(props.bundle).find((key) => props.bundle[key] !== props.previousBundle![key]) ||
        Object.keys(props.bundle)[0],
    )
  }

  return (
    <>
      <div class="flex flex-wrap mt-2 w-full bg-gray-100 px-1">
        <For each={Object.keys(props.bundle)}>
          {(tab) => {
            return (
              <button
                class={`px-4 py-1 my-1 rounded ${
                  bundleFile() === tab ? 'bg-gray-200' : 'bg-gray-100'
                }`}
                onClick={() => setBundleFile(tab)}
              >
                {tab}
              </button>
            )
          }}
        </For>
      </div>
      {props.children([bundleFile(), props.bundle[bundleFile()]])}
    </>
  )
}

const StatusSpan = (props: { text: string; class: string }) => {
  return (
    <span
      class={`p-2 flex w-16 text-center justify-center flex-shrink-0 flex-grow-0 text-sm mx-2 rounded text-white ${props.class}`}
    >
      {props.text}
    </span>
  )
}

const Status = (props: { item: ListItemProps }) => {
  try {
    const result = JSON.parse(props.item.result)
    const allowed = findAllowedValue(result)
    if (allowed === true) {
      return <StatusSpan text="Allowed" class="bg-green-500" />
    } else if (allowed === false) {
      return <StatusSpan text="Failure" class="bg-red-500" />
    } else if (props.item.result === 'null' || props.item.is_error === true) {
      return <StatusSpan text="Error" class="bg-amber-500" />
    }

    return <StatusSpan text="Unknown" class="bg-gray-500" />
  } catch {}

  return <StatusSpan text="Unknown" class="bg-gray-500" />
}

const findAllowedValue = (data: any): any => {
  if (typeof data === 'object' && data !== null) {
    if ('allowed' in data) {
      return data.allowed
    } else if ('allow' in data) {
      return data.allow
    } else {
      for (const key in data) {
        const value = findAllowedValue(data[key])
        if (value !== undefined) {
          return value
        }
      }
    }
  }

  return undefined
}

type TabBarProps = {
  hasPolicy: boolean
  tab: Accessor<Tabs>
  setTab: Setter<Tabs>
}

const TabBar = (props: TabBarProps) => {
  return (
    <div class="flex mt-2 w-full bg-gray-100">
      <For each={Tabs}>
        {(tab, index) => {
          if (tab === 'Bundle' && !props.hasPolicy) {
            return null
          }

          return (
            <button
              class={`${index() !== 0 && 'ml-2'} w-full px-4 rounded-xl ${
                props.tab() === tab ? 'bg-gray-200' : 'bg-gray-100'
              }`}
              onClick={() => props.setTab(tab)}
            >
              {tab}
            </button>
          )
        }}
      </For>
    </div>
  )
}

const SmallEditor = (props: { value: string; language: string; previousValue?: string }) => {
  if (props.previousValue === undefined || props.previousValue === props.value) {
    return (
      <MonacoEditor
        class={`h-full mt-2 flex grow`}
        language={props.language}
        value={props.value}
        onMount={(_, editor) => {
          editor.layout({
            width: editor.getScrollWidth(),
            height: Math.min(editor.getContentHeight(), 500),
          })
        }}
        options={{
          scrollBeyondLastLine: false,
          showFoldingControls: 'always',
          readOnly: true,
        }}
      />
    )
  }

  return (
    <MonacoDiffEditor
      class={`mt-2 h-full`}
      originalLanguage={props.language}
      modifiedLanguage={props.language}
      modified={props.value}
      original={props.previousValue}
      onMount={(_, editor) => {
        editor.layout({
          width: 100,
          height: 100,
        })
      }}
      options={{
        scrollBeyondLastLine: false,
        showFoldingControls: 'always',
        readOnly: true,
      }}
    />
  )
}

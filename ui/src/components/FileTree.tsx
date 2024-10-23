import { Component, createSignal, For, Show } from 'solid-js'
import FolderIcon from '../assets/folder.svg'
import FolderOpenIcon from '../assets/folder-open.svg'

export type Directory = {
  name?: string
  open?: boolean
  files: string[]
  directories?: Directory[]
}

export function buildTree(bundle: Record<string, string>): Directory {
  const root: Directory = { files: [], directories: [] }

  Object.keys(bundle).forEach((path) => {
    const parts = path.split('/')
    let currentDir = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]

      // Last part of the path, should be a file.
      if (i === parts.length - 1) {
        currentDir.files.push(part)
      } else {
        // Otherwise, this is a directory
        let nextDir = currentDir.directories?.find((d) => d.name === part)
        if (!nextDir) {
          nextDir = { name: part, files: [], directories: [] }
          currentDir.directories?.push(nextDir)
        }
        currentDir = nextDir
      }
    }
  })

  return root
}

// FileTree is a component that renders a file tree based on a bundle of directory and file paths, using collapsible folders.
export const FileTree: Component<{
  directory: Directory
  onClick?: (filePath: string) => void
  depth?: number
  filePath?: string
}> = (props) => {
  if (props.directory.directories?.length === 1 && props.directory.name == null) {
    return (
      <FileTree
        directory={props.directory.directories[0]}
        onClick={props.onClick}
        depth={(props.depth ?? 0) + 1}
        filePath={props.filePath !== undefined ? '/' + props.filePath : ''}
      />
    )
  }

  return (
    <>
      <For each={props.directory.directories}>
        {(dir) => {
          const [open, setOpen] = createSignal(false)

          return (
            <>
              <div class="flex w-full flex-row">
                {Array.from({ length: props.depth ?? 0 }).map((_, __) => (
                  <span class="text-gray-400 pl-1 pr-2 text-3xl font-extralight items-center text-center">
                    |
                  </span>
                ))}
                <button
                  class="px-4  w-full py-1 break-words mx-2 mt-2 rounded hover:bg-slate-300 bg-gray-100 flex items-center"
                  onClick={() => setOpen(!open())}
                >
                  <Show when={open()} fallback={<FolderIcon class="w-4 h-4 mr-2" />}>
                    <FolderOpenIcon class="w-4 h-4 mr-2" />
                  </Show>

                  {dir.name}
                </button>
              </div>
              <Show when={open()}>
                <FileTree
                  directory={dir}
                  depth={(props.depth ?? 0) + 1}
                  filePath={
                    props.filePath !== undefined ? props.filePath + '/' + dir.name : dir.name
                  }
                  onClick={props.onClick}
                />
              </Show>
            </>
          )
        }}
      </For>

      <For each={props.directory.files}>
        {(file) => (
          <div class="flex w-full flex-row">
            {Array.from({ length: props.depth ?? 0 }).map((_, __) => (
              <span class="text-gray-400 pl-1 pr-2 text-3xl font-extralight items-center text-center">
                |
              </span>
            ))}
            <button
              class="px-4 text-left py-1 w-full break-words mx-2 mt-2 rounded hover:bg-slate-300 bg-gray-100"
              onClick={() =>
                props.onClick?.(props.filePath !== undefined ? props.filePath + '/' + file : file)
              }
            >
              {file}
            </button>
          </div>
        )}
      </For>
    </>
  )
}

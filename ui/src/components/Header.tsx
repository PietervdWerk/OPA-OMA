import { Button } from './ui/button'
import { useData } from './DataContext'
import { EvalResult } from '../types/EvalResult'

import OpaIcon from '../assets/opa.svg'
import PlayIcon from '../assets/play-circle.svg'
import FormatIcon from '../assets/format-icon.svg'
import PublishIcon from '../assets/publish-icon.svg'
import SettingsIcon from '../assets/gear-icon.svg'
import { backend_url } from '../utils/backend_url'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { unwrap } from 'solid-js/store'
import { TextField, TextFieldInput, TextFieldLabel } from './ui/text-field'

export const Header = () => {
  const {
    data,
    input,
    bundle,
    editingPolicy,
    setBundle,
    setOutput,
    setCoverage,
    setLocalHistory,
    options,
    setOptions,
  } = useData()

  async function evaluate() {
    try {
      const res = await fetch(`${backend_url}/api/eval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: unwrap(options),
          data: data(),
          input: input(),
          bundle: bundle,
        }),
      })

      if (!res.ok) {
        setOutput(await res.text())
      } else {
        res.json().then((evalResult: EvalResult) => {
          if (evalResult.errors) {
            let output = `${evalResult.errors.length} error${
              evalResult.errors.length > 1 ? 's' : ''
            } occurred:\n`
            evalResult.errors.forEach((err) => {
              output += `${err.location.file}:${err.location.row} ${err.code}\n ${err.message}\n`
            })

            setOutput(output)
          } else {
            setOutput(JSON.stringify(evalResult.result, null, 2))
          }

          if (evalResult.coverage && options.coverage) {
            setCoverage(evalResult.coverage)
          }

          setLocalHistory((history) => [
            {
              decision_id: evalResult.id,
              bundle: JSON.parse(JSON.stringify(bundle)),
              input: input(),
              data: data(),
              path: '',
              result: evalResult.errors
                ? JSON.stringify(evalResult.errors, null, 2)
                : JSON.stringify(evalResult.result, null, 2),
              is_error: evalResult.errors != null && evalResult.errors.length > 0,
              timestamp: evalResult.timestamp,
            },
            ...history,
          ])
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function format() {
    try {
      const res = await fetch(`${backend_url}/api/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy: bundle,
        }),
      })

      if (res.ok) {
        let json: FormatResponse = { formatted: bundle[editingPolicy()] }
        try {
          json = (await res.json()) as FormatResponse
        } catch (e) {
          console.error(e)
          setOutput(await res.text())
        }

        setBundle(editingPolicy(), json.formatted)
      } else {
        setOutput(await res.text())
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <header class="w-full min-h-14 flex justify-between">
      <div class="items-center flex mx-2 ">
        <OpaIcon id="opa-logo" class="h-10" />
        <h3 class="text-xl hidden md:block text-nowrap">The Rego Playground</h3>
      </div>
      <div class="items-center flex gap-1.5 pr-2">
        <Dialog>
          <DialogTrigger as={Button}>
            <SettingsIcon class="w-5 h-5 stroke-background" />
            <span class="px-3">Settings</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle class="mb-2">Editor Settings</DialogTitle>
              <DialogDescription class="flex flex-col gap-4">
                <div class="items-top flex space-x-2">
                  <Checkbox
                    id="coverage"
                    checked={options.coverage}
                    onChange={(e) => setOptions('coverage', e)}
                  />
                  <div class="grid gap-1.5 leading-none">
                    <Label for="coverage-input">Show coverage results</Label>
                  </div>
                </div>

                <div class="grid w-full max-w-sm items-center gap-1.5">
                  <TextField onChange={(value) => setOptions('path', value)}>
                    <TextFieldLabel for="path">Path</TextFieldLabel>
                    <TextFieldInput type="url" id="path" value={options.path} />
                  </TextField>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Button onClick={evaluate}>
          <PlayIcon class="w-5 h-5 stroke-background" />
          <span class="px-3">Evaluate</span>
        </Button>
        <Button onClick={format}>
          <FormatIcon class="w-5 h-5 stroke-background" />
          <span class="px-3">Format</span>
        </Button>
        <Button>
          {' '}
          <PublishIcon class="w-5 h-5 stroke-background" />
          <span class="px-3">Publish</span>{' '}
        </Button>
      </div>
    </header>
  )
}

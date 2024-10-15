import { Editor } from '../components/Editor'
import { Header } from '../components/Header'

export const Playground = () => {
  return (
    <div class="grid grid-rows-[3.5rem_1fr] grid-cols-[1fr]">
      <Header />
      <Editor />
    </div>
  )
}

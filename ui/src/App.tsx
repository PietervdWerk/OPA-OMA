import { Router, Route, A, RouteSectionProps, useLocation } from '@solidjs/router'

import { Playground } from './pages/Playground'
import { DecisionLogs } from './pages/DecisionLogs'
import { Home } from './pages/Home'
import { DataProvider } from './components/DataContext'
import { NewFromRepository } from './pages/NewFromRepository'
import { NewFromBundle } from './pages/NewFromBundle'
import { NewEmptyPlayground } from './pages/NewEmptyPlayground'
import { BundleFileSelection } from './pages/BundleFileSelection'

import HomeIcon from './assets/home.svg'
import PlayIcon from './assets/play-circle.svg'
import LogsIcon from './assets/logs.svg'
import { Component, JSX } from 'solid-js'

const App = () => {
  return (
    <DataProvider>
      <Router root={RootPage}>
        <Route path="/" component={Home} />
        <Route path="/play" component={Playground} />
        <Route path="/decision-logs" component={DecisionLogs} />
        <Route path="/new/empty" component={NewEmptyPlayground} />
        <Route path="/new/from-repository" component={NewFromRepository} />
        <Route path="/new/from-bundle" component={NewFromBundle} />
        <Route path="/new/from-bundle/*package_id" component={BundleFileSelection} />
      </Router>
    </DataProvider>
  )
}

export default App

const RootPage = (props: RouteSectionProps<unknown>) => {
  return (
    <div class="grid grid-cols-[3.5rem_1fr] grid-rows-[1fr] h-screen w-screen">
      <div class="w-14 bg-gray-300 flex flex-col justify-center items-center">
        <SidebarItem href="/" icon={HomeIcon} />
        <SidebarItem href="/play" icon={PlayIcon} />
        <SidebarItem href="/decision-logs" icon={LogsIcon} />
      </div>
      <div>{props.children}</div>
    </div>
  )
}

const SidebarItem = (props: {
  href: string
  icon: Component<JSX.SvgSVGAttributes<SVGSVGElement>>
}) => {
  const location = useLocation()
  return (
    <A
      href={props.href}
      class="flex flex-col my-2 p-2 items-center text-sm font-thin hover:bg-gray-200 rounded-md"
    >
      <props.icon
        class={`w-8 h-8 ${location.pathname === props.href ? 'stroke-blue-400' : 'stroke-white'}`}
      />
    </A>
  )
}

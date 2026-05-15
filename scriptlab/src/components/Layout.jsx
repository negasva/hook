import Sidebar from './Sidebar'
import WorkArea from './WorkArea'
import RightPanel from './RightPanel'

export default function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <WorkArea />
        <RightPanel />
      </div>
      <StatusBar />
    </div>
  )
}

function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="font-display header-logo">ScriptLab</span>
        <span className="header-version text-label">v0.1</span>
      </div>
      <nav className="header-nav">
        {['File', 'Edit', 'View', 'Run'].map((item) => (
          <button key={item} className="nav-item text-label">{item}</button>
        ))}
      </nav>
      <div className="header-actions">
        <div className="header-dot" style={{ '--dot': '#22c55e' }} />
        <div className="header-dot" style={{ '--dot': 'var(--color-gold)' }} />
        <div className="header-dot" style={{ '--dot': '#ef4444' }} />
      </div>
    </header>
  )
}

function StatusBar() {
  return (
    <footer className="status-bar">
      <span className="text-label">Ready</span>
      <span className="text-label" style={{ marginLeft: 'auto' }}>
        ScriptLab — Dark Luxury Editorial
      </span>
    </footer>
  )
}

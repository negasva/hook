export default function Sidebar() {
  return (
    <aside className="sidebar">
      <SidebarSection label="Project">
        <EmptySlot height={120} hint="No scripts yet" />
      </SidebarSection>

      <div className="divider" />

      <SidebarSection label="Library">
        <EmptySlot height={80} hint="No assets" />
      </SidebarSection>

      <div className="divider" />

      <SidebarSection label="History">
        <EmptySlot height={60} hint="No history" />
      </SidebarSection>

      <div className="sidebar-footer">
        <div className="accent-line" />
        <p className="text-label" style={{ marginTop: 8 }}>Workspace</p>
      </div>
    </aside>
  )
}

function SidebarSection({ label, children }) {
  return (
    <section className="sidebar-section">
      <p className="text-label sidebar-section-label">{label}</p>
      {children}
    </section>
  )
}

function EmptySlot({ height, hint }) {
  return (
    <div className="empty-slot" style={{ height }}>
      <p className="text-label">{hint}</p>
    </div>
  )
}

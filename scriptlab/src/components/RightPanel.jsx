export default function RightPanel() {
  return (
    <aside className="right-panel">
      <PanelSection label="Inspector">
        <EmptySlot height={140} hint="Nothing selected" />
      </PanelSection>

      <div className="divider" />

      <PanelSection label="Properties">
        <EmptySlot height={100} hint="No properties" />
      </PanelSection>

      <div className="divider" />

      <PanelSection label="Output">
        <EmptySlot height={80} hint="No output" />
      </PanelSection>
    </aside>
  )
}

function PanelSection({ label, children }) {
  return (
    <section className="panel-section">
      <p className="text-label panel-section-label">{label}</p>
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

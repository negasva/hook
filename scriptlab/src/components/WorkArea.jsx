import { useUIStore }   from '../store/useUIStore'
import ScriptList   from './ScriptList'
import ScriptEditor from './ScriptEditor'

export default function WorkArea() {
  const activeScriptId = useUIStore((s) => s.activeScriptId)

  return (
    <main className="work-area">
      {activeScriptId ? <ScriptEditor /> : <ScriptList />}
    </main>
  )
}

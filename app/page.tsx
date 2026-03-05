import { createClient } from '@supabase/supabase-js'

export default async function Home() {
  // Diese Platzhalter ziehen sich die Daten aus den Vercel-Einstellungen
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data: tools, error } = await supabase.from('tools').select('*')

    if (error) {
      return <div style={{ padding: '40px' }}>Supabase Fehler: {error.message}</div>
    }

    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <h1>🛠 Meine Tools (Live aus der Cloud)</h1>
        <hr />
        <div style={{ marginTop: '20px' }}>
          {tools && tools.length > 0 ? (
            <ul>
              {tools.map((tool) => (
                <li key={tool.id} style={{ marginBottom: '10px' }}>
                  <strong>{tool.name}</strong> — {tool.category}
                </li>
              ))}
            </ul>
          ) : (
            <p>Keine Tools gefunden. Datenbank ist leer.</p>
          )}
        </div>
      </div>
    )
  } catch (err) {
    return <div style={{ padding: '40px' }}>Verbindungsfehler: {String(err)}</div>
  }
}

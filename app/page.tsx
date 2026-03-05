export const revalidate = 0; // Das zwingt die Seite, jedes Mal neu zu laden
import { createClient } from '@supabase/supabase-js'

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Kleiner Sicherheitscheck: Fehlen die Daten?
  if (!supabaseUrl || !supabaseKey) {
    return <div style={{ padding: '40px' }}>Fehler: Umgebungsvariablen fehlen bei Vercel!</div>
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data: tools, error } = await supabase
      .from('tools')
      .select('*')

    if (error) {
      return (
        <div style={{ padding: '40px' }}>
          <h3>Supabase Fehlermeldung:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )
    }

    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <h1>🛠 Tool-Übersicht</h1>
        <ul>
          {tools?.map((tool) => (
            <li key={tool.id}>{tool.name}</li>
          ))}
        </ul>
      </div>
    )
  } catch (err: any) {
    return (
      <div style={{ padding: '40px' }}>
        <h3>Technischer Fehler:</h3>
        <p>{err.message}</p>
        <p>Versuchte URL: {supabaseUrl}</p>
      </div>
    )
  }
}

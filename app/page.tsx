export const revalidate = 0;
import { createClient } from '@supabase/supabase-js'
import { createBooking } from './actions'

export default async function Home({ searchParams }: { searchParams: any }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Alle Tools für das Dropdown laden
  const { data: tools } = await supabase.from('tools').select('*').order('name');
  
  // 2. Welches Tool ist ausgewählt?
  const selectedToolId = searchParams?.toolId;
  const selectedTool = tools?.find(t => t.id === selectedToolId);

  // 3. Buchungen für den Kalender laden
  let toolBookings: any[] = []
  if (selectedToolId) {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('tool_id', selectedToolId)
    toolBookings = data || []
  }

  // Hilfsfunktion: Check ob Tag belegt ist
  const isBooked = (dateStr: string) => {
    return toolBookings.some(b => {
      const start = new Date(b.start_date).getTime();
      const end = new Date(b.end_date).getTime();
      const current = new Date(dateStr).getTime();
      return current >= start && current <= end;
    });
  }

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', color: '#333' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛠 Equipment Planer</h1>
        <p style={{ color: '#666' }}>Wähle ein Tool aus der Liste, um den Kalender anzuzeigen.</p>
      </header>

      {/* DROPDOWN AUSWAHL */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Tool auswählen:</label>
        <select 
          onChange={(e) => {
            if(e.target.value) window.location.href = `?toolId=${e.target.value}`;
          }}
          value={selectedToolId || ""}
          style={{ 
            padding: '12px 20px', 
            fontSize: '1.1rem', 
            borderRadius: '8px', 
            border: '2px solid #0070f3',
            width: '100%',
            maxWidth: '400px',
            cursor: 'pointer',
            backgroundColor: '#fff'
          }}
        >
          <option value="">-- Bitte wählen --</option>
          {tools?.map(tool => (
            <option key={tool.id} value={tool.id}>{tool.name}</option>
          ))}
        </select>
      </div>

      {/* KALENDER BEREICH - Erscheint nur, wenn ein Tool gewählt wurde */}
      {selectedToolId ? (
        <div style={{ 
          background: '#fff', 
          padding: '30px', 
          borderRadius: '16px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #eaeaea'
        }}>
          <h2 style={{ color: '#0070f3', marginTop: 0 }}>📅 Kalender für: {selectedTool?.name}</h2>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Status für März 2026:</p>
          
          {/* Kalender Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '10px',
            marginTop: '20px'
          }}>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', color: '#999', fontSize: '0.8rem' }}>{d}</div>
            ))}
            
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const dateStr = `2026-03-${day.toString().padStart(2, '0')}`;
              const booked = isBooked(dateStr);
              
              return (
                <div key={i} style={{
                  aspectRatio: '1/1',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  backgroundColor: booked ? '#ffe3e3' : '#f0fff4',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: booked ? '#e53e3e' : '#38a169',
                  fontWeight: booked ? 'bold' : 'normal'
                }}>
                  {day}
                  {booked && <span style={{ fontSize: '0.5rem', textTransform: 'uppercase' }}>belegt</span>}
                </div>
              );
            })}
          </div>

          {/* BUCHUNGSFORMULAR */}
          <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '20px' }}>Zeitraum reservieren</h3>
            <form action={createBooking} style={{ display: 'grid', gap: '15px' }}>
              <input type="hidden" name="toolId" value={selectedToolId} />
              
              <input name="userName" placeholder="Dein Name" required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Start</label>
                  <input type="date" name="startDate" required style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Ende</label>
                  <input type="date" name="endDate" required style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
              </div>

              <button type="submit" style={{ 
                padding: '15px', 
                backgroundColor: '#0070f3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 4px 10px rgba(0, 112, 243, 0.3)'
              }}>
                Jetzt eintragen
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          backgroundColor: '#fff', 
          borderRadius: '16px', 
          border: '2px dashed #ccc' 
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>☝️</div>
          <h2 style={{ color: '#999' }}>Kein Tool ausgewählt</h2>
          <p>Bitte wähle oben ein Gerät aus der Liste aus.</p>
        </div>
      )}
    </div>
  )
}

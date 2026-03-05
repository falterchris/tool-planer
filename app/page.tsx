export const revalidate = 0;
import { createClient } from '@supabase/supabase-js'
import { createBooking } from './actions'

export default async function Home({ searchParams }: { searchParams: any }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: tools } = await supabase.from('tools').select('*').order('name');
  const selectedToolId = searchParams?.toolId;
  const selectedTool = tools?.find(t => t.id === selectedToolId);

  let toolBookings: any[] = []
  if (selectedToolId) {
    const { data } = await supabase.from('bookings').select('*').eq('tool_id', selectedToolId)
    toolBookings = data || []
  }

  const isBooked = (day: number, month: number, year: number) => {
    const current = new Date(year, month, day).getTime();
    return toolBookings.some(b => {
      const start = new Date(b.start_date).getTime();
      const end = new Date(b.end_date).getTime();
      return current >= start && current <= end;
    });
  }

  const monate = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', fontSize: '13px' }}>
      <h1 style={{ textAlign: 'center' }}>📅 Equipment Jahresplaner 2026</h1>

      {/* DROPDOWN - Jetzt mit FIX für das Zurückspringen */}
      <div style={{ marginBottom: '30px', textAlign: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
        <form method="GET" action="/" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <select name="toolId" style={{ padding: '8px', borderRadius: '4px' }}>
            <option value="">-- Gerät auswählen --</option>
            {tools?.map(tool => (
              <option key={tool.id} value={tool.id} selected={selectedToolId === tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
          <button type="submit" style={{ padding: '8px 15px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Planer laden
          </button>
        </form>
      </div>

      {selectedToolId ? (
        <>
          {/* DER JAHRESPLANER 2026 */}
          <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #ddd', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Monat</th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i} style={{ padding: '5px', border: '1px solid #ddd', width: '25px', fontSize: '10px' }}>{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monate.map((monat, monthIndex) => (
                  <tr key={monat}>
                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', background: '#fdfdfd' }}>{monat}</td>
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      // Prüfen, ob der Tag im Monat existiert (z.B. 31. Feb gibt es nicht)
                      const date = new Date(2026, monthIndex, day);
                      const isValidDay = date.getMonth() === monthIndex;
                      const booked = isValidDay && isBooked(day, monthIndex, 2026);

                      return (
                        <td key={i} style={{
                          border: '1px solid #ddd',
                          padding: '0',
                          backgroundColor: !isValidDay ? '#eee' : (booked ? '#ff4d4f' : 'transparent'),
                          height: '30px'
                        }}>
                          {isValidDay && <span style={{ fontSize: '9px', color: booked ? 'white' : '#999' }}>{day}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BUCHUNGSFORMULAR */}
          <div style={{ marginTop: '30px', maxWidth: '400px', padding: '20px', border: '1px solid #0070f3', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Neue Buchung für {selectedTool?.name}</h3>
            <form action={createBooking} style={{ display: 'grid', gap: '10px' }}>
              <input type="hidden" name="toolId" value={selectedToolId} />
              <input name="userName" placeholder="Dein Name" required style={{ padding: '8px' }} />
              <input type="date" name="startDate" required style={{ padding: '8px' }} />
              <input type="date" name="endDate" required style={{ padding: '8px' }} />
              <button type="submit" style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Speichern
              </button>
            </form>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '50px', fontSize: '1.2rem' }}>
          Wähle ein Gerät aus, um die Jahresübersicht zu sehen.
        </div>
      )}
    </div>
  )
}

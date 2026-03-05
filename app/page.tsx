export const revalidate = 0;
import { createClient } from '@supabase/supabase-js'
import { createBooking } from './actions'

export default async function Home({ searchParams }: { searchParams: any }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Daten laden
  const { data: tools } = await supabase.from('tools').select('*').order('name');
  const selectedToolId = searchParams?.toolId;
  const selectedTool = tools?.find(t => t.id === selectedToolId);

  let toolBookings: any[] = []
  if (selectedToolId) {
    const { data } = await supabase.from('bookings').select('*').eq('tool_id', selectedToolId)
    toolBookings = data || []
  }

  // Hilfsfunktionen
  const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  
  const getStatus = (day: number, month: number) => {
    const year = 2026;
    const date = new Date(year, month, day);
    // Check ob Datum gültig (z.B. 31. Feb ausschließen)
    if (date.getMonth() !== month) return "invalid";
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const time = date.getTime();
    
    const booked = toolBookings.some(b => {
      const start = new Date(b.start_date).getTime();
      const end = new Date(b.end_date).getTime();
      return time >= start && time <= end;
    });

    if (booked) return "booked";
    if (isWeekend) return "weekend";
    return "free";
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#1a202c' }}>🗓 Equipment Jahresplaner 2026</h1>

      {/* DROPDOWN BEREICH */}
      <div style={{ marginBottom: '30px', textAlign: 'center', background: '#f7fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <form method="GET" action="/" style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold' }}>Gerät wählen:</label>
          <select 
            name="toolId" 
            key={selectedToolId} // Wichtig für React Refresh
            defaultValue={selectedToolId || ""} 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '250px', fontSize: '1rem' }}
          >
            <option value="">-- Bitte wählen --</option>
            {tools?.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
          <button type="submit" style={{ padding: '10px 25px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Kalender anzeigen
          </button>
        </form>
      </div>

      {selectedToolId ? (
        <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
          <h2 style={{ color: '#2b6cb0', marginBottom: '15px' }}>📍 Belegungsplan: {selectedTool?.name}</h2>
          
          {/* LEGENDE */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '0.85rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '15px', height: '15px', background: '#fc8181', border: '1px solid #e53e3e' }}></div> Belegt</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '15px', height: '15px', background: '#edf2f7', border: '1px solid #cbd5e0' }}></div> Wochenende</div>
          </div>

          {/* GROSSE TABELLEN-ANSICHT */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#edf2f7' }}>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'left', minWidth: '80px' }}>Monat</th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i} style={{ padding: '5px', border: '1px solid #e2e8f0', width: '30px' }}>{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monate.map((monat, mIdx) => (
                  <tr key={monat}>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 'bold', background: '#f8fafc' }}>{monat}</td>
                    {Array.from({ length: 31 }, (_, dIdx) => {
                      const status = getStatus(dIdx + 1, mIdx);
                      
                      let bgColor = 'transparent';
                      if (status === 'invalid') bgColor = '#f7fafc';
                      if (status === 'weekend') bgColor = '#edf2f7';
                      if (status === 'booked') bgColor = '#fc8181';

                      return (
                        <td key={dIdx} style={{
                          border: '1px solid #e2e8f0',
                          padding: '0',
                          backgroundColor: bgColor,
                          height: '35px',
                          textAlign: 'center',
                          color: status === 'booked' ? 'white' : '#718096'
                        }}>
                          {status !== 'invalid' && (dIdx + 1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BUCHUNGS-FORMULAR UNTER DEM KALENDER */}
          <div style={{ marginTop: '40px', background: '#fff', padding: '25px', borderRadius: '12px', border: '2px solid #3182ce', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, color: '#2c5282' }}>Neue Reservierung eintragen</h3>
            <form action={createBooking} style={{ display: 'grid', gap: '15px' }}>
              <input type="hidden" name="toolId" value={selectedToolId} />
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Wer reserviert?</label>
                <input name="userName" placeholder="Dein Name" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Von</label>
                  <input type="date" name="startDate" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Bis</label>
                  <input type="date" name="endDate" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
                </div>
              </div>
              <button type="submit" style={{ padding: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Jetzt buchen
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px', color: '#a0aec0' }}>
          <div style={{ fontSize: '4rem' }}>🏗️</div>
          <h2>Bereit zum Planen?</h2>
          <p>Wähle oben ein Gerät aus, um die Jahresübersicht zu laden.</p>
        </div>
      )}
    </div>
  )
}

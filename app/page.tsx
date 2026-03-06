'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createBooking } from './actions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: 'chris' }
  }
);

export default function Home() {
  const [tools, setTools] = useState<any[]>([]);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  // Tools beim Start laden
  useEffect(() => {
    supabase.from('tools').select('*').order('name').then(({ data }) => setTools(data || []));
  }, []);

  // Buchungen laden (Funktion extrahiert, damit wir sie nach dem Buchen neu aufrufen können)
  const fetchBookings = async (id: string) => {
    const { data } = await supabase.from('bookings').select('*').eq('tool_id', id);
    setBookings(data || []);
  };

  useEffect(() => {
    if (selectedToolId) {
      fetchBookings(selectedToolId);
      setRange({ start: null, end: null });
    }
  }, [selectedToolId]);

  // Zeit-Vergleichs-Hilfe ohne Zeitzonen-Probleme
  const getTimestamp = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  const handleDateClick = (dateStr: string, isBooked: boolean, isInvalid: boolean) => {
    if (isBooked || isInvalid) return;

    if (!range.start || (range.start && range.end)) {
      setRange({ start: dateStr, end: null });
    } else {
      const startT = getTimestamp(range.start);
      const endT = getTimestamp(dateStr);
      
      if (endT < startT) {
        setRange({ start: dateStr, end: null });
      } else {
        setRange({ ...range, end: dateStr });
      }
    }
  };

  // Buchung abschicken und Kalender sofort aktualisieren
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    await createBooking(formData);
    
    // WICHTIG: Buchungen neu laden, damit sie sofort erscheinen
    if (selectedToolId) {
      await fetchBookings(selectedToolId);
    }
    
    setRange({ start: null, end: null });
    setIsSubmitting(false);
  };

  const getStatus = (day: number, month: number) => {
    const year = 2026;
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) return "invalid";
    
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const currentTime = date.getTime();
    
    // Check ob gebucht (Wir vergleichen nur das Datum-Format YYYY-MM-DD)
    const isBooked = bookings.some(b => {
      const startT = getTimestamp(b.start_date);
      const endT = getTimestamp(b.end_date);
      return currentTime >= startT && currentTime <= endT;
    });

    const isSelected = range.start && range.end 
      ? (currentTime >= getTimestamp(range.start) && currentTime <= getTimestamp(range.end))
      : (range.start === dateStr);

    if (isBooked) return "booked";
    if (isSelected) return "selected";
    if (date.getDay() === 0 || date.getDay() === 6) return "weekend";
    return "free";
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>🗓 Equipment Planer 2026</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>1. Gerät auswählen</label>
          <select 
            value={selectedToolId} 
            onChange={(e) => setSelectedToolId(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0' }}
          >
            <option value="">-- Bitte wählen --</option>
            {tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ opacity: selectedToolId ? 1 : 0.5 }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>2. Zeitraum reservieren</label>
          <form action={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input type="hidden" name="toolId" value={selectedToolId} />
            <input name="userName" placeholder="Dein Name" required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', flex: 1 }} />
            <input type="date" name="startDate" value={range.start || ''} readOnly required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#f1f5f9' }} />
            <input type="date" name="endDate" value={range.end || ''} readOnly required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#f1f5f9' }} />
            <button 
              type="submit" 
              disabled={isSubmitting || !range.end}
              style={{ padding: '10px 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: range.end ? 1 : 0.6 }}
            >
              {isSubmitting ? 'Speichert...' : 'Buchen'}
            </button>
          </form>
        </div>
      </div>

      {selectedToolId ? (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#edf2f7' }}>
                <th style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Monat</th>
                {Array.from({ length: 31 }, (_, i) => <th key={i} style={{ padding: '5px', border: '1px solid #e2e8f0', width: '30px' }}>{i + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              {monate.map((monat, mIdx) => (
                <tr key={monat}>
                  <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 'bold', background: '#f8fafc' }}>{monat}</td>
                  {Array.from({ length: 31 }, (_, dIdx) => {
                    const status = getStatus(dIdx + 1, mIdx);
                    const day = dIdx + 1;
                    const dateStr = `2026-${(mIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    
                    let bgColor = 'transparent';
                    if (status === 'invalid') bgColor = '#f7fafc';
                    if (status === 'weekend') bgColor = '#f1f5f9';
                    if (status === 'booked') bgColor = '#feb2b2';
                    if (status === 'selected') bgColor = '#63b3ed';

                    return (
                      <td 
                        key={dIdx} 
                        onClick={() => handleDateClick(dateStr, status === 'booked', status === 'invalid')}
                        style={{ 
                          border: '1px solid #e2e8f0', 
                          backgroundColor: bgColor, 
                          height: '35px', 
                          textAlign: 'center', 
                          cursor: (status === 'booked' || status === 'invalid') ? 'default' : 'pointer',
                          color: status === 'booked' ? '#9b2c2c' : (status === 'selected' ? 'white' : 'inherit')
                        }}
                      >
                        {status !== 'invalid' ? day : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px', border: '2px dashed #cbd5e0', color: '#a0aec0', borderRadius: '12px' }}>
          Bitte wähle ein Gerät aus.
        </div>
      )}
    </div>
  );
}

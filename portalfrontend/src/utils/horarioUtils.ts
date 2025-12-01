export const dayOrder = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];

export const shortDayNames: Record<string,string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
  domingo: 'Dom'
};

export function parseHorarioInput(horario: any): Record<string,string> | null {
  if (!horario) return null;
  if (typeof horario === 'string') {
    try {
      const parsed = JSON.parse(horario);
      if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string,string>;
      return null;
    } catch (err) {
      // If it's plain string (e.g., "9:00-18:00"), return null to fallback
      return null;
    }
  }
  if (typeof horario === 'object') return horario as Record<string,string>;
  return null;
}

export function formatHorarioSummary(horario: any): string {
  const parsed = parseHorarioInput(horario);
  if (!parsed) {
    // If it's a string or invalid JSON, return as-is (or 'N/A')
    if (typeof horario === 'string' && horario.trim() !== '') return horario;
    return 'N/A';
  }

  // Build compact summary grouping consecutive equal hours
  // We'll create an array of {day, time} in dayOrder then compress sequences
  const entries: {day: string, time: string}[] = [];
  for (const day of dayOrder) {
    if (parsed[day]) entries.push({ day, time: parsed[day] });
  }
  if (entries.length === 0) return 'N/A';

  // Group consecutive days with same time
  const groups: { from: string, to: string, time: string }[] = [];
  let curr = { from: entries[0].day, to: entries[0].day, time: entries[0].time };
  for (let i = 1; i < entries.length; i++) {
    const e = entries[i];
    if (e.time === curr.time && dayOrder.indexOf(e.day) === dayOrder.indexOf(curr.to) + 1) {
      curr.to = e.day;
    } else {
      groups.push({ ...curr });
      curr = { from: e.day, to: e.day, time: e.time };
    }
  }
  groups.push(curr);

  // Format groups into strings
  const parts = groups.map(g => {
    if (g.from === g.to) return `${shortDayNames[g.from]} ${g.time}`;
    return `${shortDayNames[g.from]}-${shortDayNames[g.to]} ${g.time}`;
  });

  return parts.join(', ');
}

export function formatHorarioList(horario: any): {day: string, time: string}[] {
  const parsed = parseHorarioInput(horario);
  if (!parsed) return [];
  const items: {day: string, time: string}[] = [];
  for (const day of dayOrder) {
    items.push({ day: shortDayNames[day] || day, time: parsed[day] || 'Cerrado' });
  }
  return items;
}

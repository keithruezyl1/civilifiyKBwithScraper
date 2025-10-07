import { getPlanDate, toISODate } from './planLoader';

const key = (date: string, person: string, type: string) => `kbprog:${date}:${person}:${type}`;
const day1Key = 'kbprog:day1';

export function getDay1Date(): string | null {
  try {
    return localStorage.getItem(day1Key);
  } catch {
    return null;
  }
}

export function setDay1Date(dateISO: string) {
  try {
    localStorage.setItem(day1Key, dateISO);
  } catch {}
}

export function getCount(dateISO: string, person: string, type: string) {
  try {
    return Number(localStorage.getItem(key(dateISO, person, type)) ?? "0");
  } catch {
    return 0;
  }
}

export function getCumulativeCount(endDateISO: string, person: string, type: string) {
  const day1 = getDay1Date();
  if (!day1) return getCount(endDateISO, person, type);
  
  let total = 0;
  try {
    const startDate = new Date(day1);
    const endDate = new Date(endDateISO);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      total += getCount(dateStr, person, type);
    }
  } catch {}
  
  return total;
}

export function setCount(dateISO: string, person: string, type: string, val: number) {
  try {
    localStorage.setItem(key(dateISO, person, type), String(Math.max(0, val)));
  } catch {}
}

export function increment(dateISO: string, person: string, type: string, max?: number) {
  const cur = getCount(dateISO, person, type);
  const next = Math.min(max ?? Infinity, cur + 1);
  setCount(dateISO, person, type, next);
  return next;
}

export function decrement(dateISO: string, person: string, type: string) {
  const cur = getCount(dateISO, person, type);
  const next = Math.max(0, cur - 1);
  setCount(dateISO, person, type, next);
  return next;
}

export function exportDate(dateISO: string) {
  const out: Record<string, number> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) as string;
      if (!k) continue;
      if (k.startsWith(`kbprog:${dateISO}:`)) {
        out[k] = Number(localStorage.getItem(k) || '0');
      }
    }
  } catch {}
  return out;
}

export function clearDate(dateISO: string) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) as string;
      if (k && k.startsWith(`kbprog:${dateISO}:`)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Function to automatically update progress when an entry is created
// SECURITY NOTE: This function should ONLY be called when an entry is CREATED, not when it's updated
// Entry updates should never affect progress calculation to prevent quota manipulation
export function updateProgressForEntry(dateISO: string, personIdOrUsername: string, entryType: string) {
  try {
    const personKey = String(personIdOrUsername).trim();
    const currentCount = getCount(dateISO, personKey, entryType);
    
    // Increment the count (only for new entries, never for updates)
    const newCount = currentCount + 1;
    setCount(dateISO, personKey, entryType, newCount);
    
    console.log(`Updated progress for ${personKey} on ${dateISO}: ${entryType} = ${newCount} (ENTRY CREATION ONLY)`);
    
    return newCount;
  } catch (error) {
    console.error('Failed to update progress for entry:', error);
    return 0;
  }
}

// Function to get progress for a specific person and entry type
export function getProgressForPerson(personId: string, entryType: string, dateISO?: string) {
  const targetDate = dateISO || toISODate(getPlanDate(new Date()));
  return getCumulativeCount(targetDate, personId, entryType);
}



/**
 * Section tints for setup bags (design spec 2026-10-18, section 3).
 *
 * Tint is by section, never by item: a 3-px left rule on the section header,
 * optionally a `-2` wash on the header band. Rows stay `--surface` white.
 * Unknown sections (Extras, Everything else) get the plain hairline.
 */

export interface SectionTint {
  /** Tailwind class for the 3-px left rule on the section header. */
  rule: string;
  /** Tailwind class for a light wash, used only on the header band if at all. */
  wash: string;
}

const TINTS: Record<string, SectionTint> = {
  enclosure: { rule: 'border-l-[3px] border-l-[var(--evergreen-7)]', wash: 'bg-[var(--evergreen-2)]' },
  'launch monitor': { rule: 'border-l-[3px] border-l-[var(--sky-7)]', wash: 'bg-[var(--sky-2)]' },
  projector: { rule: 'border-l-[3px] border-l-[var(--sand-7)]', wash: 'bg-[var(--sand-2)]' },
  pc: { rule: 'border-l-[3px] border-l-[var(--grey-7)]', wash: 'bg-[var(--grey-2)]' },
  mat: { rule: 'border-l-[3px] border-l-[var(--teed-green-7)]', wash: 'bg-[var(--teed-green-2)]' },
};

export const NO_TINT: SectionTint = { rule: 'border-l-[3px] border-l-transparent', wash: '' };

function normalize(name: string): string {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Resolve a section name ("Enclosure & screen", "Computer & software", "PC & software") to its tint. */
export function getSectionTint(name: string | null | undefined): SectionTint {
  if (!name) return NO_TINT;
  const n = normalize(name);
  if (n.startsWith('enclosure') || n.includes('screen')) return TINTS.enclosure;
  if (n.includes('launch monitor') || n.includes('monitor')) return TINTS['launch monitor'];
  if (n.includes('projector')) return TINTS.projector;
  if (n.startsWith('pc') || n.includes('computer') || n.includes('software')) return TINTS.pc;
  if (n === 'mat' || n.startsWith('mat ') || n.includes('hitting mat')) return TINTS.mat;
  return NO_TINT;
}

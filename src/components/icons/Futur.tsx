// Futuristic line icons (neon stroke, hex/orbital motifs). Inherit currentColor.
type P = { size?: number; className?: string };
const S = ({ size = 18, className, children }: P & { children: React.ReactNode }) => <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>;
export const I = {
  inbox: (p: P) => <S {...p}><path d="M4 5.5 12 3l8 2.5v9L12 21l-8-6.5z" /><path d="M8 10h8M8 13.5h5" /><circle cx="17.5" cy="6" r="1.4" fill="currentColor" /></S>,
  leads: (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" /></S>,
  products: (p: P) => <S {...p}><path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" /><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" /></S>,
  engage: (p: P) => <S {...p}><path d="M4 15.5 9.5 10l3.5 3.5L20 6.5" /><path d="M15 6.5h5v5" /><path d="M3 20.5h18" opacity=".5" /></S>,
  bookings: (p: P) => <S {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 2.8v4M16 2.8v4" /><path d="m9 15 2 2 4-4" /></S>,
  capi: (p: P) => <S {...p}><circle cx="12" cy="12" r="2" fill="currentColor" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" /></S>,
  sites: (p: P) => <S {...p}><rect x="2.5" y="4" width="19" height="16" rx="3" /><path d="M2.5 8.5h19" /><path d="m9.5 12-2.5 2.5 2.5 2.5M14.5 12l2.5 2.5-2.5 2.5" /></S>,
  settings: (p: P) => <S {...p}><path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" /><circle cx="12" cy="12" r="3" /></S>,
  admin: (p: P) => <S {...p}><path d="M12 2.5 19.5 5.5v6c0 4.5-3.2 8.3-7.5 10-4.3-1.7-7.5-5.5-7.5-10v-6z" /><path d="m9 12 2 2 4-4" /></S>,
  autopilot: (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /><path d="M19 3.5 21 5.5M5 3.5 3 5.5" /></S>,
  collapse: (p: P) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /><path d="m15.5 9.5-2.5 2.5 2.5 2.5" /></S>,
  expand: (p: P) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /><path d="m13 9.5 2.5 2.5-2.5 2.5" /></S>,
  up: (p: P) => <S {...p}><path d="m6 14 6-6 6 6" /><path d="m6 19 6-6 6 6" opacity=".4" /></S>,
  down: (p: P) => <S {...p}><path d="m6 10 6 6 6-6" /><path d="m6 5 6 6 6-6" opacity=".4" /></S>,
  send: (p: P) => <S {...p}><path d="M21 3 3 10.5l7 2.5 2.5 7z" /><path d="m21 3-11 10" /></S>,
  stop: (p: P) => <S {...p}><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" /></S>,
  mic: (p: P) => <S {...p}><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" /></S>,
  clip: (p: P) => <S {...p}><path d="m20 11.5-8.2 8.2a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" /></S>,
  spark: (p: P) => <S {...p}><path d="M12 2.5 13.8 9 20.5 12l-6.7 3L12 21.5 10.2 15 3.5 12l6.7-3z" /></S>,
  desktop: (p: P) => <S {...p}><rect x="2.5" y="3.5" width="19" height="13" rx="2" /><path d="M8 20.5h8M12 16.5v4" /></S>,
  tablet: (p: P) => <S {...p}><rect x="4.5" y="2.5" width="15" height="19" rx="2.5" /><path d="M11 18.5h2" /></S>,
  phone: (p: P) => <S {...p}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 5h2M11.2 18.5h1.6" /></S>,
  call: (p: P) => <S {...p}><path d="M5 3.5h3.5l1.5 4.5-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2" /></S>,
  heart: (p: P) => <S {...p}><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10" /></S>,
  comment: (p: P) => <S {...p}><path d="M4 5h16v11H9l-5 4z" /></S>,
  left: (p: P) => <S {...p}><path d="m15 5-7 7 7 7" /></S>,
  right: (p: P) => <S {...p}><path d="m9 5 7 7-7 7" /></S>,
  check: (p: P) => <S {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></S>,
  eye: (p: P) => <S {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12" /><circle cx="12" cy="12" r="3" /></S>,
  doc: (p: P) => <S {...p}><path d="M6 2.5h8l4.5 4.5v14.5H6z" /><path d="M14 2.5V7h4.5M9 12h6M9 15.5h6" /></S>,
  bank: (p: P) => <S {...p}><path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18" /></S>,
};
export type IconName = keyof typeof I;
export const Icon = ({ name, ...p }: P & { name: IconName }) => I[name](p);

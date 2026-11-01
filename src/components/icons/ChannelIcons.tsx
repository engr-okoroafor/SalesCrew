// Bold, futuristic channel marks: glowing hex-rounded tile, thick glyph, high contrast on dark UI.
type P = { size?: number; className?: string };
const Tile = ({ size = 24, className, id, from, to, glow, label, children }: P & { id: string; from: string; to: string; glow: string; label: string; children: React.ReactNode }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label={label} style={{ filter: `drop-shadow(0 0 ${Math.max(2, size / 6)}px ${glow})` }}>
    <defs><linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="#05070a" stroke={`url(#g-${id})`} strokeWidth="2.4" />
    <rect x="4" y="4" width="24" height="24" rx="7" fill={`url(#g-${id})`} />
    <path d="M6 10 Q16 3 26 10" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
    {children}</svg>);
export const WhatsAppIcon = (p: P) => <Tile {...p} id="wa" from="#5dffa0" to="#0aa34f" glow="#25D366" label="WhatsApp">
  <path d="M16 8.2a7.8 7.8 0 0 0-6.7 11.8L8.4 23.8l3.9-1a7.8 7.8 0 1 0 3.7-14.6Z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
  <path d="M13.2 12.6c.3-.5.7-.5 1-.3l.8 1.8c.1.3 0 .5-.2.7l-.4.5c.6 1.2 1.5 2.1 2.7 2.7l.5-.4c.2-.2.4-.3.7-.2l1.8.8c.3.2.3.6-.2 1.1-.6.6-1.5.8-2.4.4a8 8 0 0 1-4.6-4.6c-.3-.9-.1-1.8.3-2.5Z" fill="#fff" /></Tile>;
export const MessengerIcon = (p: P) => <Tile {...p} id="ms" from="#00c6ff" to="#a033ff" glow="#3b82f6" label="Messenger">
  <path d="M16 8c-4.6 0-8 3.3-8 7.7 0 2.4 1 4.4 2.6 5.7v2.8l2.5-1.4c.9.3 1.9.4 2.9.4 4.6 0 8-3.3 8-7.6S20.6 8 16 8Z" fill="#fff" />
  <path d="m10.8 18 3.6-3.9 2.2 2 3.6-2-3.6 3.9-2.2-2Z" fill="#6d28d9" stroke="#6d28d9" strokeWidth="1" strokeLinejoin="round" /></Tile>;
export const InstagramIcon = (p: P) => <Tile {...p} id="ig" from="#ffd43b" to="#d6249f" glow="#e1306c" label="Instagram">
  <rect x="9" y="9" width="14" height="14" rx="4.2" fill="none" stroke="#fff" strokeWidth="2.4" />
  <circle cx="16" cy="16" r="3.3" fill="none" stroke="#fff" strokeWidth="2.4" /><circle cx="20.4" cy="11.6" r="1.3" fill="#fff" /></Tile>;
export const ChannelIcon = ({ ch, size, className }: P & { ch: string }) => ch === "whatsapp" ? <WhatsAppIcon size={size} className={className} /> : ch === "messenger" ? <MessengerIcon size={size} className={className} /> : <InstagramIcon size={size} className={className} />;

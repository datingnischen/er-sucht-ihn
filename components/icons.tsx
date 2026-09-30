import type { SVGProps } from "react";

/**
 * Gemeinsamer Icon-Satz für Er-sucht-Ihn.de: runde Linien, 24er-Raster, currentColor.
 * Leitmotiv ist das doppelte Marssymbol (⚣) – das Zeichen schwuler Liebe.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export const HeartIcon = (p: IconProps) => <Svg {...p}><path d="M12 20.3s-7.6-4.6-7.6-10.3A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.6c0 5.7-7.6 10.3-7.6 10.3Z" /></Svg>;
export const HeartFilledIcon = (p: IconProps) => <Svg {...p}><path fill="currentColor" stroke="none" d="M12 21s-8.4-5-8.4-11.3A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 8.4 2.9C20.4 16 12 21 12 21Z" /></Svg>;
export const MarsPairIcon = (p: IconProps) => <Svg {...p}><circle cx="8.2" cy="14.2" r="4.3" /><path d="m11.3 11.1 3.5-3.5M11.4 7.6h3.4V11" /><circle cx="14.6" cy="16.4" r="4.3" /><path d="m17.7 13.3 3.5-3.5M17.8 9.8h3.4v3.4" /></Svg>;
export const PinIcon = (p: IconProps) => <Svg {...p}><path d="M12 21s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21Z" /><circle cx="12" cy="9.8" r="2.4" /></Svg>;
export const ClockIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const SparkIcon = (p: IconProps) => <Svg {...p}><path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2Z" /></Svg>;
export const ChatIcon = (p: IconProps) => <Svg {...p}><path d="M20 12.2c0 4-3.6 7-8 7-1.2 0-2.3-.2-3.3-.6L4 20l1.3-3.7A6.6 6.6 0 0 1 4 12.2c0-4 3.6-7 8-7s8 3 8 7Z" /><path d="M8.5 12.3h.01M12 12.3h.01M15.5 12.3h.01" strokeWidth="2.6" /></Svg>;
export const CalendarIcon = (p: IconProps) => <Svg {...p}><rect x="3.8" y="5.2" width="16.4" height="15" rx="3" /><path d="M3.8 10h16.4M8.3 3.2v4M15.7 3.2v4" /><path d="M12 17.2s-2.6-1.5-2.6-3.3a1.35 1.35 0 0 1 2.6-.6 1.35 1.35 0 0 1 2.6.6c0 1.8-2.6 3.3-2.6 3.3Z" /></Svg>;
export const GlassIcon = (p: IconProps) => <Svg {...p}><path d="M6 4h12l-1.2 6.2A4.9 4.9 0 0 1 12 14a4.9 4.9 0 0 1-4.8-3.8Z" /><path d="M12 14v6.2M8.4 20.2h7.2M6.7 7.6h10.6" /></Svg>;
export const TreeIcon = (p: IconProps) => <Svg {...p}><path d="M12 21v-5" /><path d="M12 3.2c3.4 0 6 2.8 6 6.1 0 3.6-2.7 6.5-6 6.5s-6-2.9-6-6.5c0-3.3 2.6-6.1 6-6.1Z" /></Svg>;
export const CoffeeIcon = (p: IconProps) => <Svg {...p}><path d="M4.5 9.5h12v4.8a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5Z" /><path d="M16.5 11h1.3a2.4 2.4 0 0 1 0 4.8h-1.6M8.2 3.8c-.6.9.6 1.6 0 2.6M12 3.8c-.6.9.6 1.6 0 2.6" /></Svg>;
export const MusicIcon = (p: IconProps) => <Svg {...p}><path d="M9 18.2V5.6l10-2v12.6" /><circle cx="6.6" cy="18.2" r="2.4" /><circle cx="16.6" cy="16.2" r="2.4" /></Svg>;
export const PeopleIcon = (p: IconProps) => <Svg {...p}><circle cx="8.6" cy="8.4" r="3.2" /><circle cx="16.4" cy="9.2" r="2.7" /><path d="M3 19.5c.5-3.3 2.8-5.4 5.6-5.4s5.1 2.1 5.6 5.4M14.2 14.4c.7-.3 1.4-.5 2.2-.5 2.3 0 4.2 1.8 4.6 4.6" /></Svg>;
export const BookIcon = (p: IconProps) => <Svg {...p}><path d="M4 5.5c2.9-1 5.6-.8 8 .8v13c-2.4-1.6-5.1-1.8-8-.8ZM20 5.5c-2.9-1-5.6-.8-8 .8v13c2.4-1.6 5.1-1.8 8-.8Z" /></Svg>;
export const ShieldIcon = (p: IconProps) => <Svg {...p}><path d="M12 3.2 19 6v5.6c0 4.4-3 7.9-7 9.2-4-1.3-7-4.8-7-9.2V6Z" /><path d="m8.8 12 2.2 2.2 4.3-4.4" /></Svg>;
export const CheckIcon = (p: IconProps) => <Svg {...p}><path d="m5 12.5 4.4 4.4L19 7.3" /></Svg>;
export const ArrowIcon = (p: IconProps) => <Svg {...p}><path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" /></Svg>;
export const SearchIcon = (p: IconProps) => <Svg {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></Svg>;
export const RainbowIcon = (p: IconProps) => <Svg {...p}><path d="M3 18a9 9 0 0 1 18 0M6.5 18a5.5 5.5 0 0 1 11 0M10 18a2 2 0 0 1 4 0" /></Svg>;
export const CameraIcon = (p: IconProps) => <Svg {...p}><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.5-2h4.8l1.5 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" /><circle cx="12" cy="12.4" r="3.4" /></Svg>;
export const PhoneIcon = (p: IconProps) => <Svg {...p}><rect x="6.5" y="2.8" width="11" height="18.4" rx="2.8" /><path d="M10.6 18h2.8" /></Svg>;
export const QuestionIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.7v.6M12 17h.01" /></Svg>;
export const StarIcon = (p: IconProps) => <Svg {...p}><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" /></Svg>;
export const BoatIcon = (p: IconProps) => <Svg {...p}><path d="M3.5 15.5h17l-2.2 3.8H5.7ZM12 4v11.5M12 5l6 8.5h-6" /></Svg>;
export const MountainIcon = (p: IconProps) => <Svg {...p}><path d="m3 19 6.2-10.5 3.6 6 2.4-3.6L21 19Z" /><path d="m7.4 11.6 1.8 1.3 1.6-1.3" /></Svg>;
export const MenuIcon = (p: IconProps) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>;
export const CloseIcon = (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const KeyIcon = (p: IconProps) => <Svg {...p}><circle cx="8" cy="12" r="3.6" /><path d="M11.6 12H20.5M17.5 12v3M20.5 12v2.2" /></Svg>;

/** Schmaler Streifen in den Farben der Pride-Flagge schwuler Männer – Markenzeichen unter Header und Heros. */
export function PrideStripe({ className = "" }: { className?: string }) {
  return <span className={`pride-stripe ${className}`.trim()} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>;
}
export const TvIcon = (p: IconProps) => <Svg {...p}><rect x="3.5" y="7" width="17" height="12" rx="3" /><path d="m8.5 3.5 3.5 3.5 3.5-3.5M9 21.5h6" /></Svg>;

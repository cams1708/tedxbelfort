import Image from "next/image";

/**
 * Official TEDxBelfort wordmark (sourced from tedxbelfort.fr). Renders the
 * light-background variant in light mode and swaps to the dark-background
 * variant in dark mode via CSS only, so it works from Server Components
 * without a client-side theme-detection flash.
 */
export function TedxLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <>
      <Image
        src="/tedx-logo-black.png"
        alt="TEDxBelfort"
        width={437}
        height={110}
        priority={priority}
        className={`block dark:hidden ${className ?? ""}`}
      />
      <Image
        src="/tedx-logo-white.png"
        alt="TEDxBelfort"
        width={437}
        height={110}
        priority={priority}
        className={`hidden dark:block ${className ?? ""}`}
      />
    </>
  );
}

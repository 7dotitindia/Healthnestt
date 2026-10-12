import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BottomNav from "@/components/BottomNav";
import ChromeGate from "@/components/ChromeGate";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import CookieNotice from "@/components/CookieNotice";

// One geometric sans for everything, matching the reference design (medium-weight headlines, regular body).
const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

// The header lists categories from the database, so it must never be frozen at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: "Plain-language health articles with sources, health calculators and practical guidance for readers in India.",
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_IN" },
  twitter: { card: "summary" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121214" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        {/* Sets the light/dark theme before first paint, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* Runs before first paint. Marks the page as "motion allowed" so scroll-reveal items start hidden,
            and gives up after 4s if the animation code never arrives, so content can never stay hidden. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('js-motion');setTimeout(function(){if(!d.classList.contains('gsap-ready'))d.classList.remove('js-motion')},4000)}}catch(e){}})()",
          }}
        />
        <noscript><style>{"[data-reveal] .reveal{opacity:1!important;transform:none!important}"}</style></noscript>
      </head>
      <body className="min-h-dvh flex flex-col">
        <a className="skip" href="#main">Skip to content</a>
        <ChromeGate><SiteHeader /></ChromeGate>
        <div id="main" className="flex-1">{children}</div>
        <ChromeGate><SiteFooter /></ChromeGate>
        <BottomNav />
        <ChromeGate><CookieNotice /></ChromeGate>
      </body>
    </html>
  );
}

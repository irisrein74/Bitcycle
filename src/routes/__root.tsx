import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppProviders } from "@/components/app-providers";
import appCss from "../styles.css?url";

const APP_NAME = "BitCycle";
const APP_DESCRIPTION =
  "Plataforma de gestión para reciclaje tecnológico RAEE y canje de componentes STEM en San José, Santa María, Catamarca.";
const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, "");
const OG_IMAGE_URL = SITE_URL ? `${SITE_URL}/og.jpg` : "/og.jpg";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: APP_DESCRIPTION },
      { name: "theme-color", content: "#12352C" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: APP_DESCRIPTION },
      ...(SITE_URL ? [{ property: "og:url", content: SITE_URL }] : []),
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:image:alt", content: "BitCycle, gestión de reciclaje tecnológico RAEE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: APP_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppProviders>
          <Outlet />
        </AppProviders>
        <Scripts />
      </body>
    </html>
  ),
});

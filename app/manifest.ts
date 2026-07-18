import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes Agent Market installable and gives it a proper
 * identity (name, brand colors, icon) when added to a home screen / app dock.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agent Market — The marketplace for autonomous agent labor",
    short_name: "Agent Market",
    description:
      "Discover, hire, pay, and verify specialized AI agents through one programmable marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#17151c",
    theme_color: "#7857ff",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  };
}

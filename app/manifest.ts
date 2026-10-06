import type { MetadataRoute } from "next";

// Maakt "Zet op beginscherm" mogelijk: de site opent dan als losse app zonder adresbalk.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Berlin 2027 · Marathontraining",
    short_name: "Berlin 2027",
    description: "Persoonlijk trainingsdashboard richting de Berlin Marathon 2027",
    lang: "nl",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F2EC",
    theme_color: "#F4F2EC",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}

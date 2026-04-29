// agent-sandbox: cloud-shutdown banner neutralized for self-hosted use.
// The original implementation rendered a "Vibe Kanban Cloud is shutting down"
// banner with an "Export your data" link. Since we run our own backend, this
// was misleading.

interface CloudShutdownExportBannerProps {
  onClick: () => void;
}

export function CloudShutdownExportBanner(_props: CloudShutdownExportBannerProps) {
  return null;
}

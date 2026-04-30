// Patched out for self-hosted deployments.
// Upstream renders a "Vibe Kanban Cloud is shutting down" banner; that
// message refers to BloopAI's hosted service, which doesn't apply when
// you run your own remote-server stack.

interface CloudShutdownExportBannerProps {
  onClick: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CloudShutdownExportBanner(_props: CloudShutdownExportBannerProps) {
  return null;
}

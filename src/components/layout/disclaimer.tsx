import Link from "next/link";

export function DisclaimerFooter() {
  return (
    <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground" data-chrome>
      For medical education only. Not for diagnosis or treatment of patients. AI explanations can be wrong; verify with
      authoritative sources. <Link href="/disclaimer" className="underline">Read the full disclaimer</Link>.
    </footer>
  );
}

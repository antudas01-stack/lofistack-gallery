import { codeToHtml } from "shiki";
import { CopyButton } from "./copy-button";

export async function CodeBlock({
  code,
  lang = "tsx",
  filename,
  maxHeight = "32rem",
}: {
  code: string;
  lang?: string;
  filename?: string;
  maxHeight?: string;
}) {
  const html = await codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: "light",
  });

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <span className="truncate font-mono text-xs text-fg-muted">{filename ?? lang}</span>
        <CopyButton text={code} />
      </div>
      <div
        className="overflow-auto text-[13px] leading-6 [&_pre]:p-4 [&_pre]:font-mono"
        style={{ maxHeight }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

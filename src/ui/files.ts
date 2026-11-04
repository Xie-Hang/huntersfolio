// Saving a file the player asked for (the feedback export). Desktop: a Save dialog from the shell.
// Browser: an ordinary download.
type FileBridge = { save(name: string, text: string): Promise<boolean> };
const bridge = (): FileBridge | undefined =>
  typeof window !== 'undefined' ? (window.hf as { files?: FileBridge } | undefined)?.files : undefined;

export async function saveTextFile(name: string, text: string): Promise<boolean> {
  const b = bridge();
  if (b) return b.save(name, text);
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch { return false; }
}

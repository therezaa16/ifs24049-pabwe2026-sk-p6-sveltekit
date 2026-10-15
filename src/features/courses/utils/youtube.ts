// Mengubah berbagai bentuk tautan YouTube menjadi URL embed yang aman dipakai pada iframe.
export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

import { describe, it, expect } from "vitest";
import { getYoutubeId, getYoutubeEmbedUrl } from "./youtube";

describe("youtube utils", () => {
  it("should extract id from supported url formats", () => {
    expect(getYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYoutubeId("https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should return null for empty or unsupported urls", () => {
    expect(getYoutubeId(null)).toBeNull();
    expect(getYoutubeId(undefined)).toBeNull();
    expect(getYoutubeId("")).toBeNull();
    expect(getYoutubeId("https://example.com/video")).toBeNull();
  });

  it("should build embed url", () => {
    expect(getYoutubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(getYoutubeEmbedUrl("nonsense")).toBeNull();
  });
});

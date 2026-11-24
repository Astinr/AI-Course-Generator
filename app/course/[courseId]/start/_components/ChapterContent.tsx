import { ChapterContentType, ChapterType } from "@/types/types";
import React, { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import ReactMarkdown from "react-markdown";
import { LuBookOpen, LuTimer } from "react-icons/lu";

type ChapterContentProps = {
  chapter: ChapterType;
  content: ChapterContentType | null;
  chapterNumber: number;
  totalChapters: number;
};

const videoOpts = {
  height: "100%",
  width: "100%",
  playerVars: {
    autoplay: 0,
  },
};

function getCodeText(code: string[] | string) {
  const text = Array.isArray(code) ? code.join("") : code;
  return text.replace(/<\/?precode>/gi, "").trim();
}

const ChapterContent = ({
  chapter,
  content,
  chapterNumber,
  totalChapters,
}: ChapterContentProps) => {
  const videoAnchorRef = useRef<HTMLDivElement>(null);
  const [isFloatingVideo, setIsFloatingVideo] = useState(false);

  useEffect(() => {
    const updateFloatingState = () => {
      const anchor = videoAnchorRef.current;
      if (!anchor || !content?.videoId) {
        setIsFloatingVideo(false);
        return;
      }

      const returnThreshold = window.innerWidth < 768 ? 126 : 24;
      const bounds = anchor.getBoundingClientRect();
      setIsFloatingVideo((isFloating) =>
        isFloating
          ? bounds.top < returnThreshold
          : bounds.bottom < returnThreshold
      );
    };

    updateFloatingState();
    window.addEventListener("scroll", updateFloatingState, { passive: true });
    window.addEventListener("resize", updateFloatingState);

    return () => {
      window.removeEventListener("scroll", updateFloatingState);
      window.removeEventListener("resize", updateFloatingState);
    };
  }, [content?.videoId]);

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-secondary px-3 py-1 font-medium text-primary">
            Lesson {String(chapterNumber).padStart(2, "0")} of{" "}
            {String(totalChapters).padStart(2, "0")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LuTimer aria-hidden="true" />
            {chapter.duration}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {chapter.chapter_name}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          {chapter.description}
        </p>
      </header>

      {content?.videoId && (
        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <LuBookOpen aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">Watch and learn</h2>
              <p className="text-sm text-muted-foreground">
                A related video for this lesson
              </p>
            </div>
          </div>
          <div
            ref={videoAnchorRef}
            className="relative aspect-video w-full"
          >
            {isFloatingVideo && (
              <div className="aspect-video w-full" aria-hidden="true" />
            )}
            <div
              className={
                isFloatingVideo
                  ? "fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border bg-background p-3 shadow-2xl transition-all duration-300 ease-out"
                  : "absolute inset-0 overflow-hidden rounded-xl bg-muted transition-all duration-300 ease-out"
              }
            >
              {isFloatingVideo && (
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <span className="truncate text-xs font-medium">
                    {chapter.chapter_name}
                  </span>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                    Now playing
                  </span>
                </div>
              )}
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <YouTube
                  videoId={content.videoId}
                  opts={videoOpts}
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Lesson notes
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Key concepts
          </h2>
        </div>

        {content?.content.length ? (
          <div className="space-y-4">
            {content.content.map((item, index) => (
              <section
                key={`${item.title}-${index}`}
                className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <ReactMarkdown
                      className="mt-3 space-y-4 text-sm leading-7 text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_code]:rounded-md [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-primary [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
                    >
                      {item.explanation}
                    </ReactMarkdown>

                    {item.code_examples && item.code_examples.length > 0 && (
                      <div className="mt-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Example
                        </p>
                        {item.code_examples.map((example, exampleIndex) => (
                          <pre
                            key={exampleIndex}
                            className="overflow-x-auto rounded-xl border bg-muted p-4 text-sm leading-6 text-foreground"
                          >
                            <code className="font-mono">
                              {getCodeText(example.code)}
                            </code>
                          </pre>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
            <p className="font-medium">Lesson content isn’t available yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Return to the course outline and generate the lesson content.
            </p>
          </div>
        )}
      </section>
    </article>
  );
};

export default ChapterContent;

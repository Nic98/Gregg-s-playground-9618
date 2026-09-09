import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Circle,
  Gamepad2,
  Monitor,
  Network,
  Square,
  VectorSquare,
} from 'lucide-react';
import {
  chapters,
  demosForChapter,
  demoSummary,
  sectionAnchor,
  type Demo,
} from '../data/syllabus';

function DemoCard({ demo }: { demo: Demo }) {
  const content = (
    <>
      <div
        className={`demo-preview demo-preview-${demo.id}`}
        aria-hidden="true"
      >
        {demo.id === 'packet-frame' ? (
          <>
            <div className="client-preview-art">
              <Network size={56} />
              <span>→</span>
              <Network size={40} />
            </div>
            <span>DATA → SEGMENT → PACKET → FRAME</span>
          </>
        ) : demo.id === 'vector-drawing' ? (
          <>
            <div className="vector-preview-art">
              <Square size={94} />
              <Circle size={76} />
              <VectorSquare size={30} />
            </div>
            <span>OBJECT → PROPERTIES → DRAWING</span>
          </>
        ) : (
          <>
            <div className="client-preview-art">
              <Monitor size={40} />
              <span>↔</span>
              <Gamepad2 size={40} />
            </div>
            <span>CLOUD GAMING / LOCAL GAMING</span>
          </>
        )}
      </div>
      <div className="demo-card-body">
        <div className="demo-card-meta">
          <span>{demo.sectionId}</span>
          <span
            className={`demo-status ${demo.status === 'live' ? 'status-live' : 'status-planned'}`}
          >
            {demo.status === 'live' ? 'Live demo' : 'In planning · 设计中'}
          </span>
        </div>
        <h3>{demo.title}</h3>
        <p>{demo.description}</p>
        <ul className="demo-concepts" aria-label="Concepts covered">
          {demo.concepts.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="demo-launch">
          {demo.status === 'live' ? (
            <>
              Open demo
              <ArrowRight size={18} />
            </>
          ) : (
            'Demo not available yet'
          )}
        </div>
      </div>
    </>
  );
  return demo.status === 'live' && demo.path ? (
    <Link
      className="demo-card"
      to={demo.path}
      aria-label={`Open ${demo.title}`}
    >
      {content}
    </Link>
  ) : (
    <article className="demo-card demo-card-planned">{content}</article>
  );
}
export function ChapterPage() {
  const { chapterId } = useParams();
  const chapter = chapters.find((c) => String(c.id) === chapterId);
  useEffect(() => {
    document.title = chapter
      ? `${chapter.id}. ${chapter.title} · Gregg’s AS Playground`
      : 'Chapter not found · Gregg’s AS Playground';
  }, [chapter]);
  if (!chapter)
    return (
      <main className="course-main">
        <h1>Chapter not found.</h1>
        <Link className="course-text-link" to="/">
          Back to all chapters →
        </Link>
      </main>
    );
  const chapterDemos = demosForChapter(chapter.id);
  return (
    <main className="course-main chapter-page">
      <Link className="chapter-back" to="/">
        <ArrowLeft size={16} />
        All chapters
      </Link>
      <header className="chapter-intro">
        <p className="course-kicker">
          PAPER {chapter.paper} <span> / </span> CHAPTER{' '}
          {String(chapter.id).padStart(2, '0')}
        </p>
        <h1>{chapter.title}</h1>
        <p>
          {chapter.sections.length} syllabus{' '}
          {chapter.sections.length === 1 ? 'section' : 'sections'}{' '}
          <span>·</span> {demoSummary(chapter.id)}
        </p>
        <nav className="section-jump" aria-label="Sections in this chapter">
          {chapter.sections.map((section) => (
            <button
              key={section.id}
              onClick={() =>
                document
                  .getElementById(sectionAnchor(section.id))
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              {section.id}
              <span>{section.title}</span>
            </button>
          ))}
        </nav>
      </header>
      <div className="chapter-sections">
        {chapter.sections.map((section) => {
          const sectionDemos = chapterDemos.filter(
            (d) => d.sectionId === section.id,
          );
          return (
            <section
              className={`chapter-subsection ${sectionDemos.length ? 'with-demos' : ''}`}
              id={sectionAnchor(section.id)}
              key={section.id}
              aria-labelledby={`heading-${sectionAnchor(section.id)}`}
            >
              <div className="subsection-heading">
                <span>{section.id}</span>
                <h2 id={`heading-${sectionAnchor(section.id)}`}>
                  {section.title}
                </h2>
                {!sectionDemos.length && (
                  <span className="section-empty-label">No demos yet</span>
                )}
              </div>
              {sectionDemos.length > 0 && (
                <div className="demo-grid">
                  {sectionDemos.map((demo) => (
                    <DemoCard key={demo.id} demo={demo} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {chapterDemos.length === 0 && (
        <div className="chapter-empty">
          <BookOpen size={28} />
          <h2>This chapter is ready for its first demo.</h2>
          <p>
            New demonstrations will appear under the matching syllabus section.
          </p>
          <Link className="course-text-link" to="/">
            Explore other chapters →
          </Link>
        </div>
      )}
    </main>
  );
}

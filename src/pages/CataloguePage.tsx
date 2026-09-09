import { useEffect } from 'react';
import { ArrowDown, ArrowRight, BookOpen, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  chapters,
  chapterPath,
  demoSummary,
  demosForChapter,
  paperTitles,
} from '../data/syllabus';

export function CataloguePage() {
  useEffect(() => {
    document.title = 'Gregg’s AS CS Playground · Chapter catalogue';
  }, []);
  return (
    <main className="course-main">
      <header className="catalogue-intro">
        <p className="course-kicker">
          <Layers3 size={16} /> CLASSROOM DEMO COLLECTION
        </p>
        <h1>
          Explore computer science.
          <br />
          <span>One chapter at a time.</span>
        </h1>
        <p>
          Interactive demonstrations organised by the Cambridge AS 9618
          syllabus. Choose a chapter, then explore its topics.
        </p>
        <nav className="paper-jump" aria-label="Jump to a paper">
          {([1, 2] as const).map((p) => (
            <button
              key={p}
              onClick={() =>
                document
                  .getElementById(`paper-${p}`)
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Paper {p}
              <ArrowDown size={15} />
            </button>
          ))}
        </nav>
      </header>
      {([1, 2] as const).map((paper) => (
        <section
          className="paper-section"
          id={`paper-${paper}`}
          key={paper}
          aria-labelledby={`paper-heading-${paper}`}
        >
          <div className="paper-heading">
            <div>
              <p className="course-kicker">PAPER {paper}</p>
              <h2 id={`paper-heading-${paper}`}>{paperTitles[paper]}</h2>
            </div>
            <span>{paper === 1 ? 'Chapters 1–8' : 'Chapters 9–12'}</span>
          </div>
          <div className="chapter-grid">
            {chapters
              .filter((c) => c.paper === paper)
              .map((chapter) => {
                const list = demosForChapter(chapter.id);
                const live = list.some((d) => d.status === 'live');
                const planned = list.some((d) => d.status === 'planned');
                return (
                  <Link
                    className={`chapter-card ${live ? 'has-live' : ''}`}
                    to={chapterPath(chapter.id)}
                    key={chapter.id}
                  >
                    <div className="chapter-card-meta">
                      <span className="chapter-number">
                        {String(chapter.id).padStart(2, '0')}
                      </span>
                      <span
                        className={`demo-status ${live ? 'status-live' : planned ? 'status-planned' : ''}`}
                      >
                        {demoSummary(chapter.id)}
                      </span>
                    </div>
                    <h3>{chapter.title}</h3>
                    <ul className="chapter-section-list">
                      {chapter.sections.map((section) => (
                        <li key={section.id}>
                          <span>{section.id}</span>
                          {section.title}
                        </li>
                      ))}
                    </ul>
                    <div className="chapter-card-footer">
                      <span>
                        <BookOpen size={15} />
                        {chapter.sections.length}{' '}
                        {chapter.sections.length === 1 ? 'section' : 'sections'}
                      </span>
                      <span>
                        Explore chapter
                        <ArrowRight size={17} />
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </main>
  );
}

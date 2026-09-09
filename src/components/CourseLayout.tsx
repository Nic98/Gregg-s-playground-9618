import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, BookOpen, VectorSquare } from 'lucide-react';
import {
  chapters,
  chapterPath,
  demosForChapter,
  syllabusEdition,
} from '../data/syllabus';

export function CourseLayout() {
  const location = useLocation();
  const current = chapters.find((c) => location.pathname === chapterPath(c.id));
  return (
    <div className="course-shell">
      <aside className="course-sidebar" aria-label="Course navigation">
        <Link
          className="course-brand"
          to="/"
          aria-label="Gregg’s AS Playground home"
        >
          <span className="brand-icon">
            <VectorSquare size={25} />
          </span>
          <span>
            <strong>Gregg’s</strong>
            <small>AS CS PLAYGROUND</small>
          </span>
        </Link>
        <NavLink className="all-chapters" to="/" end>
          <BookOpen size={18} /> All chapters
        </NavLink>
        <nav>
          {([1, 2] as const).map((paper) => (
            <div className="sidebar-paper" key={paper}>
              <p>
                Paper {paper}
                <span>
                  {paper === 1 ? 'Theory' : 'Problem-solving & programming'}
                </span>
              </p>
              {chapters
                .filter((c) => c.paper === paper)
                .map((chapter) => (
                  <NavLink
                    key={chapter.id}
                    to={chapterPath(chapter.id)}
                    className="sidebar-chapter"
                  >
                    <span className="nav-number">
                      {String(chapter.id).padStart(2, '0')}
                    </span>
                    <span>{chapter.title}</span>
                    {demosForChapter(chapter.id).some(
                      (d) => d.status === 'live',
                    ) && (
                      <span
                        className="nav-live"
                        aria-label="Live demo available"
                      />
                    )}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-syllabus">
          <BookOpen size={18} />
          <span>
            Cambridge AS Computer Science
            <strong>9618 · {syllabusEdition}</strong>
          </span>
        </div>
      </aside>
      <div className="course-content">
        <header className="course-topbar">
          <span>
            AS 9618 <span className="topbar-divider">/</span>{' '}
            {current ? `Chapter ${current.id}` : 'Course catalogue'}
          </span>
          <span className="course-edition">{syllabusEdition} syllabus</span>
        </header>
        <details className="mobile-course-nav">
          <summary>
            <BookOpen size={17} />
            Browse chapters
          </summary>
          <nav aria-label="Mobile chapter navigation">
            <Link
              to="/"
              onClick={(e) =>
                e.currentTarget.closest('details')?.removeAttribute('open')
              }
            >
              All chapters
            </Link>
            {chapters.map((c) => (
              <Link
                key={c.id}
                to={chapterPath(c.id)}
                onClick={(e) =>
                  e.currentTarget.closest('details')?.removeAttribute('open')
                }
              >
                {c.id}. {c.title}
              </Link>
            ))}
          </nav>
        </details>
        <Outlet />
        <footer className="course-footer">
          <span>Gregg’s AS CS Playground</span>
          <a
            href="https://nic98.github.io/Gregg-s-playground/"
            target="_blank"
            rel="noreferrer"
          >
            IGCSE 0478 Playground <ArrowUpRight size={14} />
          </a>
        </footer>
      </div>
    </div>
  );
}

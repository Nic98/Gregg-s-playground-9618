import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CourseLayout } from './components/CourseLayout';
import { CataloguePage } from './pages/CataloguePage';
import { ChapterPage } from './pages/ChapterPage';
import VectorStudioPage from './pages/VectorStudioPage';
import PacketJourneyPage from './pages/PacketJourneyPage';
import ClientLabPage from './pages/ClientLabPage';
import CsmaCdPage from './pages/CsmaCdPage';
import {
  csmaDemoPath,
  clientDemoPath,
  vectorDemoPath,
  packetDemoPath,
} from './data/syllabus';
import './catalogue.css';

function RoutePosition() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo?.({ top: 0 });
    }
  }, [location.pathname, location.hash]);
  return null;
}
function NotFound() {
  useEffect(() => {
    document.title = 'Page not found · Gregg’s AS Playground';
  }, []);
  return (
    <main className="course-main">
      <p className="course-kicker">PAGE NOT FOUND</p>
      <h1>This page is not in the course.</h1>
      <Link className="course-text-link" to="/">
        Back to the chapter catalogue →
      </Link>
    </main>
  );
}
export default function App() {
  return (
    <>
      <RoutePosition />
      <Routes>
        <Route element={<CourseLayout />}>
          <Route index element={<CataloguePage />} />
          <Route path="chapters/:chapterId" element={<ChapterPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path={vectorDemoPath} element={<VectorStudioPage />} />
        <Route path={packetDemoPath} element={<PacketJourneyPage />} />
        <Route path={clientDemoPath} element={<ClientLabPage />} />
        <Route path={csmaDemoPath} element={<CsmaCdPage />} />
        <Route
          path="vector-drawing-studio"
          element={<Navigate to={vectorDemoPath} replace />}
        />
        <Route path="top" element={<Navigate to={vectorDemoPath} replace />} />
        <Route
          path="code-lab"
          element={<Navigate to={`${vectorDemoPath}#code-lab`} replace />}
        />
      </Routes>
    </>
  );
}

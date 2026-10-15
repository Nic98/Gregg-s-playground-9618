import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CourseLayout } from './components/CourseLayout';
import { CataloguePage } from './pages/CataloguePage';
import { ChapterPage } from './pages/ChapterPage';
import VectorStudioPage from './pages/VectorStudioPage';
import PacketJourneyPage from './pages/PacketJourneyPage';
import ClientLabPage from './pages/ClientLabPage';
import CsmaCdPage from './pages/CsmaCdPage';
import SubnettingPage from './pages/SubnettingPage';
import ArrayStructurePage from './pages/ArrayStructurePage';
import { structureLessons } from './demos/arrayStructures';
import {
  subnettingDemoPath,
  csmaDemoPath,
  clientDemoPath,
  vectorDemoPath,
  packetDemoPath,
} from './data/syllabus';
import './catalogue.css';
import {
  ProjectionProvider,
  ProjectionToolbar,
} from './components/ProjectionSettings';

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
    <ProjectionProvider>
      <ProjectionToolbar />
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
        <Route path={subnettingDemoPath} element={<SubnettingPage />} />
        <Route
          path={structureLessons.linear.path}
          element={<ArrayStructurePage key="linear" kind="linear" />}
        />
        <Route
          path={structureLessons.circular.path}
          element={<ArrayStructurePage key="circular" kind="circular" />}
        />
        <Route
          path={structureLessons.stack.path}
          element={<ArrayStructurePage key="stack" kind="stack" />}
        />
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
    </ProjectionProvider>
  );
}

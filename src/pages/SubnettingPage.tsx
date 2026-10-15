import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import './subnetting.css';
import {
  applyProjectionPreferences,
  useProjection,
} from '../components/ProjectionSettings';

const labUrl = `${import.meta.env.BASE_URL}labs/subnetting_as9618_lab.html`;

export default function SubnettingPage() {
  const { theme, classroom, lowLoad } = useProjection();
  const frame = useRef<HTMLIFrameElement>(null);
  const syncProjection = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.head || !doc.documentElement) return;
    if (!doc.getElementById('projection-styles')) {
      const link = doc.createElement('link');
      link.id = 'projection-styles';
      link.rel = 'stylesheet';
      link.media = 'screen';
      link.href = new URL(
        `${import.meta.env.BASE_URL}projection.css`,
        document.baseURI,
      ).href;
      doc.head.append(link);
    }
    doc.documentElement.dataset.projectionLab = 'subnetting';
    applyProjectionPreferences(doc.documentElement, {
      theme,
      classroom,
      lowLoad,
    });
  }, [theme, classroom, lowLoad]);
  useEffect(syncProjection, [syncProjection]);
  useEffect(() => {
    document.title = 'Subnetting Lab · Gregg’s AS Playground';
  }, []);

  return (
    <div className="subnetting-page">
      <nav className="subnetting-nav" aria-label="Lab navigation">
        <Link to="/chapters/2#section-2-1">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Chapter 2 · 2.1 Networks</span>
        </Link>
        <a href={labUrl} target="_blank" rel="noopener noreferrer">
          <span>Open in new tab</span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </nav>
      <main className="subnetting-content">
        <iframe
          ref={frame}
          onLoad={syncProjection}
          title="AS 9618 Subnetting Lab"
          src={labUrl}
        />
      </main>
    </div>
  );
}

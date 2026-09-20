import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import './subnetting.css';

const labUrl = `${import.meta.env.BASE_URL}labs/subnetting_as9618_lab.html`;

export default function SubnettingPage() {
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
        <iframe title="AS 9618 Subnetting Lab" src={labUrl} />
      </main>
    </div>
  );
}

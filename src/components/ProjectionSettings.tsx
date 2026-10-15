import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Maximize, Minimize, Projector, Settings2 } from 'lucide-react';

export type ProjectionTheme = 'off' | 'dark' | 'light';
export type ProjectionPreferences = {
  theme: ProjectionTheme;
  classroom: boolean;
  lowLoad: boolean;
};
export const projectionStorageKey = 'greggs-as-projection-v1';
const defaults: ProjectionPreferences = {
  theme: 'off',
  classroom: true,
  lowLoad: true,
};

export function readProjectionPreferences(): ProjectionPreferences {
  try {
    const value = JSON.parse(
      localStorage.getItem(projectionStorageKey) ?? 'null',
    );
    return {
      theme:
        value?.theme === 'dark' || value?.theme === 'light'
          ? value.theme
          : 'off',
      classroom:
        typeof value?.classroom === 'boolean'
          ? value.classroom
          : defaults.classroom,
      lowLoad:
        typeof value?.lowLoad === 'boolean' ? value.lowLoad : defaults.lowLoad,
    };
  } catch {
    return defaults;
  }
}

export function applyProjectionPreferences(
  root: HTMLElement,
  preferences: ProjectionPreferences,
) {
  if (preferences.theme === 'off') {
    delete root.dataset.projection;
    delete root.dataset.classroom;
    delete root.dataset.lowLoad;
  } else {
    root.dataset.projection = preferences.theme;
    root.dataset.classroom = String(preferences.classroom);
    root.dataset.lowLoad = String(preferences.lowLoad);
  }
}

const ProjectionContext = createContext({
  ...defaults,
  enabled: false,
  update: (_patch: Partial<ProjectionPreferences>) => {},
});
export const useProjection = () => useContext(ProjectionContext);

export function ProjectionProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readProjectionPreferences);
  useLayoutEffect(() => {
    applyProjectionPreferences(document.documentElement, preferences);
    return () => applyProjectionPreferences(document.documentElement, defaults);
  }, [preferences]);
  useEffect(() => {
    try {
      localStorage.setItem(projectionStorageKey, JSON.stringify(preferences));
    } catch {
      // Display settings remain usable when browser storage is unavailable.
    }
  }, [preferences]);
  return (
    <ProjectionContext
      value={{
        ...preferences,
        enabled: preferences.theme !== 'off',
        update: (patch) =>
          setPreferences((current) => ({ ...current, ...patch })),
      }}
    >
      {children}
    </ProjectionContext>
  );
}

export function ProjectionToolbar() {
  const settings = useProjection();
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState('');
  const toolbar = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  useLayoutEffect(() => {
    const resize = () =>
      document.documentElement.style.setProperty(
        '--projection-toolbar-height',
        `${toolbar.current?.offsetHeight ?? 0}px`,
      );
    resize();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    if (toolbar.current) observer?.observe(toolbar.current);
    return () => {
      observer?.disconnect();
      document.documentElement.style.removeProperty(
        '--projection-toolbar-height',
      );
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open]);
  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  return (
    <aside
      className="projection-toolbar"
      aria-label="Classroom display"
      ref={toolbar}
    >
      <div className="projection-bar">
        <span className="projection-brand">
          <Projector size={22} aria-hidden="true" />
          <strong>Projector</strong>
          <span>
            {settings.enabled
              ? `${settings.theme === 'dark' ? 'Dark' : 'Light'} · high contrast`
              : 'Standard view'}
          </span>
        </span>
        <button
          type="button"
          ref={toggle}
          aria-expanded={open}
          aria-controls="projection-settings"
          onClick={() => setOpen(!open)}
        >
          <Settings2 size={20} aria-hidden="true" /> Display settings
        </button>
      </div>
      <div
        id="projection-settings"
        className="projection-settings"
        hidden={!open}
      >
        <fieldset>
          <legend>Projection theme</legend>
          <div className="projection-themes">
            {(['off', 'dark', 'light'] as const).map((theme) => (
              <button
                type="button"
                key={theme}
                aria-pressed={settings.theme === theme}
                onClick={() => settings.update({ theme })}
              >
                {theme === 'off'
                  ? 'Standard'
                  : theme === 'dark'
                    ? 'Dark contrast'
                    : 'Light contrast'}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="projection-options">
          <label>
            <input
              type="checkbox"
              checked={settings.classroom}
              disabled={!settings.enabled}
              onChange={(event) =>
                settings.update({ classroom: event.target.checked })
              }
            />
            Classroom layout{' '}
            <small>More room for the experiment; compact navigation.</small>
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.lowLoad}
              disabled={!settings.enabled}
              onChange={(event) =>
                settings.update({ lowLoad: event.target.checked })
              }
            />
            Low-load animations{' '}
            <small>Fewer redraws and no glow. Movement stays visible.</small>
          </label>
        </div>
        <p>
          Projection modes enlarge text and controls. CSMA/CD starts at a slower
          speed; you can still pause or step through. Settings are saved in this
          browser.
        </p>
        <div className="projection-actions">
          {document.fullscreenEnabled && (
            <button
              type="button"
              onClick={async () => {
                try {
                  if (document.fullscreenElement)
                    await document.exitFullscreen();
                  else await document.documentElement.requestFullscreen();
                  setMessage('');
                } catch {
                  setMessage(
                    'Fullscreen is unavailable. You can use the browser’s fullscreen command.',
                  );
                }
              }}
            >
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
          )}
          <button type="button" onClick={close}>
            Done
          </button>
          <output>{message}</output>
        </div>
      </div>
    </aside>
  );
}

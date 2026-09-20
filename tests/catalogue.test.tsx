import React from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import App from '../src/App';

const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'scrollIntoView',
);
beforeAll(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});
afterAll(() => {
  vi.unstubAllGlobals();
  if (originalScrollIntoView)
    Object.defineProperty(
      Element.prototype,
      'scrollIntoView',
      originalScrollIntoView,
    );
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

function renderRoute(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('AS chapter catalogue', () => {
  it('opens the English CSMA/CD lab through its Pages link and returns to Networks', () => {
    window.history.replaceState(
      null,
      '',
      '/Gregg-s-playground-9618/#/chapters/2/csma-cd',
    );
    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'CSMA/CD, in six steps.' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: /2.1 Networks/ }));
    const networks = screen.getByRole('region', {
      name: 'Networks including the internet',
    });
    fireEvent.click(
      within(networks).getByRole('link', { name: 'Open CSMA/CD: Six Steps' }),
    );
    expect(window.location.hash).toBe('#/chapters/2/csma-cd');
    expect(
      screen.getByRole('heading', { name: 'CSMA/CD, in six steps.' }),
    ).toBeTruthy();
  });

  it('groups all 12 chapter entries under the correct AS papers', () => {
    renderRoute();
    const paper1 = screen.getByRole('region', { name: 'Theory Fundamentals' });
    const paper2 = screen.getByRole('region', {
      name: 'Fundamental Problem-solving and Programming Skills',
    });
    expect(
      within(paper1)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(Array.from({ length: 8 }, (_, i) => `/chapters/${i + 1}`));
    expect(
      within(paper2)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(Array.from({ length: 4 }, (_, i) => `/chapters/${i + 9}`));
    expect(within(paper1).getAllByText('1 live demo')).toHaveLength(1);
    expect(within(paper1).getByText('4 live demos')).toBeTruthy();
    expect(within(paper1).getByText('Multimedia')).toBeTruthy();
    expect(
      within(paper2).getByText('Program Testing and Maintenance'),
    ).toBeTruthy();
  });

  it('opens the vector demo from Multimedia and returns to its chapter', () => {
    renderRoute();
    fireEvent.click(
      within(screen.getByRole('main')).getByRole('link', {
        name: /Information representation/,
      }),
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Information representation',
    );
    const multimedia = screen.getByRole('region', { name: 'Multimedia' });
    fireEvent.click(
      within(multimedia).getByRole('link', {
        name: 'Open Vector Drawing Studio',
      }),
    );
    expect(screen.getByLabelText('Editable SVG drawing list')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('link', {
        name: /Chapter 1 · Information representation/,
      }),
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Information representation',
    );
    expect(screen.getByRole('region', { name: 'Multimedia' }).id).toBe(
      'section-1-2',
    );
    fireEvent.click(
      within(screen.getByRole('main')).getByRole('link', {
        name: 'All chapters',
      }),
    );
    expect(
      screen.getByRole('region', { name: 'Theory Fundamentals' }),
    ).toBeTruthy();
  });

  it('launches the thin/thick client game from Networks and returns to its chapter', () => {
    renderRoute('/chapters/2');
    const networks = screen.getByRole('region', {
      name: 'Networks including the internet',
    });
    expect(
      within(networks).getByRole('heading', {
        name: 'Thin & Thick Client Lab',
      }),
    ).toBeTruthy();
    fireEvent.click(
      within(networks).getByRole('link', {
        name: 'Open Thin & Thick Client Lab',
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Run example route' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: /2.1 Networks/ }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Communication',
    );
    expect(
      screen.queryByRole('heading', { name: 'Vector Drawing Studio' }),
    ).toBeNull();
  });

  it('shows syllabus sections and a usable return path for an empty chapter', () => {
    renderRoute('/chapters/10');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Data Types and Structures',
    );
    expect(screen.getByRole('region', { name: 'Arrays' })).toBeTruthy();
    expect(
      screen.getByRole('region', {
        name: 'Introduction to Abstract Data Types (ADT)',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText('This chapter is ready for its first demo.'),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('link', { name: /Explore other chapters/ }),
    );
    expect(
      screen.getByRole('region', { name: 'Theory Fundamentals' }),
    ).toBeTruthy();
  });

  it.each([
    ['/chapters/99', 'Chapter not found.'],
    ['/missing-page', 'This page is not in the course.'],
  ])('provides a catalogue return link for %s', (path, heading) => {
    renderRoute(path);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(heading);
    fireEvent.click(
      within(screen.getByRole('main')).getByRole('link', { name: /Back to/ }),
    );
    expect(
      screen.getByRole('region', { name: 'Theory Fundamentals' }),
    ).toBeTruthy();
  });

  it('loads and reloads a demo at the GitHub Pages project path using hash routing', () => {
    window.history.replaceState(
      null,
      '',
      '/Gregg-s-playground-9618/#/chapters/1/vector-drawing-studio',
    );
    const firstVisit = render(
      <HashRouter>
        <App />
      </HashRouter>,
    );
    expect(screen.getByLabelText('Editable SVG drawing list')).toBeTruthy();
    firstVisit.unmount();
    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );
    expect(screen.getByLabelText('Editable SVG drawing list')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('link', {
        name: /Chapter 1 · Information representation/,
      }),
    );
    expect(window.location.hash).toBe('#/chapters/1#section-1-2');
    expect(screen.getByRole('region', { name: 'Multimedia' })).toBeTruthy();
  });
});

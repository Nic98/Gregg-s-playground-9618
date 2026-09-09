export interface SyllabusSection {
  id: string;
  title: string;
}
export interface Chapter {
  id: number;
  title: string;
  paper: 1 | 2;
  sections: SyllabusSection[];
}
export interface Demo {
  id: string;
  chapterId: number;
  sectionId: string;
  title: string;
  description: string;
  concepts: string[];
  status: 'live' | 'planned';
  path?: string;
}
export const syllabusEdition = '2027–2029';
export const paperTitles = {
  1: 'Theory Fundamentals',
  2: 'Fundamental Problem-solving and Programming Skills',
} as const;
export const chapters: Chapter[] = [
  {
    id: 1,
    title: 'Information representation',
    paper: 1,
    sections: [
      { id: '1.1', title: 'Data Representation' },
      { id: '1.2', title: 'Multimedia' },
      { id: '1.3', title: 'Compression' },
    ],
  },
  {
    id: 2,
    title: 'Communication',
    paper: 1,
    sections: [{ id: '2.1', title: 'Networks including the internet' }],
  },
  {
    id: 3,
    title: 'Hardware',
    paper: 1,
    sections: [
      { id: '3.1', title: 'Computers and their components' },
      { id: '3.2', title: 'Logic Gates and Logic Circuits' },
    ],
  },
  {
    id: 4,
    title: 'Processor Fundamentals',
    paper: 1,
    sections: [
      { id: '4.1', title: 'Central Processing Unit (CPU) Architecture' },
      { id: '4.2', title: 'Assembly Language' },
      { id: '4.3', title: 'Bit manipulation' },
    ],
  },
  {
    id: 5,
    title: 'System Software',
    paper: 1,
    sections: [
      { id: '5.1', title: 'Operating Systems' },
      { id: '5.2', title: 'Language Translators' },
    ],
  },
  {
    id: 6,
    title: 'Security, privacy and data integrity',
    paper: 1,
    sections: [
      { id: '6.1', title: 'Data Security' },
      { id: '6.2', title: 'Data Integrity' },
    ],
  },
  {
    id: 7,
    title: 'Ethics and Ownership',
    paper: 1,
    sections: [{ id: '7.1', title: 'Ethics and Ownership' }],
  },
  {
    id: 8,
    title: 'Databases',
    paper: 1,
    sections: [
      { id: '8.1', title: 'Database Concepts' },
      { id: '8.2', title: 'Database Management Systems (DBMS)' },
      {
        id: '8.3',
        title:
          'Data Definition Language (DDL) and Data Manipulation Language (DML)',
      },
    ],
  },
  {
    id: 9,
    title: 'Algorithm Design and Problem-solving',
    paper: 2,
    sections: [
      { id: '9.1', title: 'Computational Thinking Skills' },
      { id: '9.2', title: 'Algorithms' },
    ],
  },
  {
    id: 10,
    title: 'Data Types and Structures',
    paper: 2,
    sections: [
      { id: '10.1', title: 'Data Types and Records' },
      { id: '10.2', title: 'Arrays' },
      { id: '10.3', title: 'Files' },
      { id: '10.4', title: 'Introduction to Abstract Data Types (ADT)' },
    ],
  },
  {
    id: 11,
    title: 'Programming',
    paper: 2,
    sections: [
      { id: '11.1', title: 'Programming Basics' },
      { id: '11.2', title: 'Constructs' },
      { id: '11.3', title: 'Structured Programming' },
    ],
  },
  {
    id: 12,
    title: 'Software Development',
    paper: 2,
    sections: [
      { id: '12.1', title: 'Program Development Life cycle' },
      { id: '12.2', title: 'Program Design' },
      { id: '12.3', title: 'Program Testing and Maintenance' },
    ],
  },
];
export const vectorDemoPath = '/chapters/1/vector-drawing-studio';
export const clientDemoPath = '/chapters/2/thin-thick-client-lab';
export const demos: Demo[] = [
  {
    id: 'vector-drawing',
    chapterId: 1,
    sectionId: '1.2',
    title: 'Vector Drawing Studio',
    description:
      'Select a shape, change its properties and rebuild the image from an ordered drawing list. Then create your own vector graphic.',
    concepts: ['Drawing object', 'Property', 'Drawing list'],
    status: 'live',
    path: vectorDemoPath,
  },
  {
    id: 'thin-thick-clients',
    chapterId: 2,
    sectionId: '2.1',
    title: 'Thin & Thick Client Lab',
    description:
      'Cloud gaming and a locally installed single-player game: compare where processing happens, then explore network and hardware dependence.',
    concepts: ['Thin client', 'Thick client', 'Client-side processing'],
    status: 'live',
    path: clientDemoPath,
  },
];
export function chapterPath(id: number) {
  return `/chapters/${id}`;
}
export function sectionAnchor(id: string) {
  return `section-${id.replace('.', '-')}`;
}
export function demosForChapter(id: number) {
  return demos.filter((d) => d.chapterId === id);
}
export function demoSummary(id: number) {
  const list = demosForChapter(id);
  const live = list.filter((d) => d.status === 'live').length;
  const planned = list.filter((d) => d.status === 'planned').length;
  if (live)
    return `${live} live ${live === 1 ? 'demo' : 'demos'}${planned ? ` · ${planned} planned` : ''}`;
  return planned ? `${planned} demo in planning` : 'No demos yet';
}

import { describe, expect, it } from 'vitest';
import {
  contentionStory,
  priorityStory,
  storyPosition,
} from '../src/demos/csmaStories';
import { simulateLoad } from '../src/demos/csmaLoad';

describe('animation traces', () => {
  it('ends repeated collisions at the real retry limit and preserves non-monotonic draws', () => {
    const story = contentionStory();
    const waits = story.filter((beat) => beat.phase === 'wait');
    expect(waits).toHaveLength(15);
    expect(waits.slice(0, 4).map((beat) => beat.devices[0].wait)).toEqual([
      1, 3, 2, 12,
    ]);
    expect(story.at(-1)?.phase).toBe('failed');
    expect(story.at(-1)?.collisions).toBe(16);
    expect(story.every((beat) => beat.delivered === 0)).toBe(true);
    expect(storyPosition(story, story.at(-1)!.end).progress).toBe(1);
  });
  it('delivers both frames with different waits, while urgent labels never enter the model', () => {
    expect(contentionStory(1).at(-1)?.delivered).toBe(2);
    const story = priorityStory(4, 0);
    expect(story.find((beat) => beat.phase === 'send')?.senders).toEqual([1]);
    expect(story.at(-1)?.delivered).toBe(2);
    const close = priorityStory(0, 1).filter((beat) => beat.phase === 'send');
    expect(close[1].start).toBeGreaterThanOrEqual(close[0].end);
    expect(priorityStory(2, 2).at(-1)?.phase).toBe('jam');
    expect(priorityStory(2, 2).at(-1)?.delivered).toBe(0);
  });
  it('keeps every animated load snapshot consistent with frame accounting', () => {
    const result = simulateLoad(20, 12);
    expect(result.snapshots).toHaveLength(600);
    result.snapshots.forEach((frame) => {
      expect(frame.generated).toBe(
        frame.delivered + frame.pending + frame.dropped,
      );
      expect(frame.queues.reduce((sum, q) => sum + q, 0)).toBe(frame.pending);
      if (frame.phase === 'data') expect(frame.senders).toHaveLength(1);
      if (frame.phase === 'collision')
        expect(frame.senders.length).toBeGreaterThan(1);
    });
    expect(result.snapshots.at(-1)?.delivered).toBe(result.delivered);
  });
});

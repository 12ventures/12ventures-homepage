import { MOCK_NOTES_BY_STYLE, MOCK_ORIGINAL_ROOM, MOCK_PRODUCTS, MOCK_STYLED_BY_STYLE } from '../mock/room';
import type { RoomJob, StyleId } from '../types';

export interface HavenClient {
  createJob(file: File | null, styleId: StyleId, localPreviewUrl?: string): Promise<RoomJob>;
  getJob(id: string): Promise<RoomJob>;
}

const jobs = new Map<string, RoomJob>();

function uid(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Frontend-only client — swap for a real HTTP implementation later. */
export class MockHavenClient implements HavenClient {
  async createJob(
    _file: File | null,
    styleId: StyleId,
    localPreviewUrl?: string,
  ): Promise<RoomJob> {
    // Keep the network wait short; the UI owns the longer generate choreography.
    await wait(900 + Math.random() * 500);
    const id = uid();
    const job: RoomJob = {
      id,
      styleId,
      originalImageUrl: localPreviewUrl || MOCK_ORIGINAL_ROOM,
      styledImageUrl: MOCK_STYLED_BY_STYLE[styleId],
      notes: MOCK_NOTES_BY_STYLE[styleId],
      products: MOCK_PRODUCTS,
      status: 'ready',
    };
    jobs.set(id, job);
    return job;
  }

  async getJob(id: string): Promise<RoomJob> {
    const job = jobs.get(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    return job;
  }
}

export const havenClient: HavenClient = new MockHavenClient();

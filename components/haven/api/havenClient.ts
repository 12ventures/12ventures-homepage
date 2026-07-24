import { MOCK_ORIGINAL_ROOM } from '../mock/room';
import { STYLE_PERSONALITIES } from '../mock/styles';
import type {
  HavenUpload,
  RoomJob,
  RoomSet,
  RoomSetDetail,
  StyleId,
  StylePersonality,
} from '../types';
import { itemsOf, mapJob, mapRoomSet, mapRoomSetDetail, mapStyle } from './mappers';

/**
 * Same Twelve Ventures API host as MLKCH initiatives.
 * Local: VITE_MLKCH_API_URL=http://localhost:8000/api/v1
 */
const API_BASE =
  (import.meta.env.VITE_MLKCH_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000/api/v1';

const HAVEN_BASE = `${API_BASE}/twelve-ventures/haven`;

const POLL_MS = 1500;
const POLL_MAX_MS = 5 * 60 * 1000;

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export class HavenApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface HavenClient {
  listStyles(): Promise<StylePersonality[]>;
  listRoomSets(opts?: { styleId?: string; tag?: string }): Promise<RoomSet[]>;
  getRoomSet(id: string): Promise<RoomSetDetail>;
  /** Curated featured set — 404 if none. */
  getDemoRoom(): Promise<RoomSetDetail>;
  upload(file: File): Promise<HavenUpload>;
  createJob(
    uploadId: string,
    styleId: StyleId,
    roomSetId?: string,
  ): Promise<{ jobId: string; status: string }>;
  getJob(jobId: string): Promise<RoomJob>;
  styleRoom(opts: {
    file: File | null;
    previewUrl: string;
    styleId: StyleId;
    roomSetId?: string;
    signal?: AbortSignal;
  }): Promise<RoomJob>;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new HavenApiError(res.statusText || 'Request failed', res.status);
  }
  if (!res.ok || !json.success) {
    throw new HavenApiError(json.message || res.statusText || 'Request failed', res.status);
  }
  return json.data;
}

async function havenFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${HAVEN_BASE}${path}`, init);
  return parseEnvelope<T>(res);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileFromPreviewUrl(previewUrl: string): Promise<File> {
  const res = await fetch(previewUrl);
  if (!res.ok) throw new Error('Could not load room image for upload.');
  const blob = await res.blob();
  const type = blob.type || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  return new File([blob], `room.${ext}`, { type });
}

export class HttpHavenClient implements HavenClient {
  async listStyles(): Promise<StylePersonality[]> {
    const data = await havenFetch<unknown>('/styles');
    return itemsOf<Record<string, unknown>>(data)
      .map(mapStyle)
      .filter((s) => s.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async listRoomSets(opts?: { styleId?: string; tag?: string }): Promise<RoomSet[]> {
    const params = new URLSearchParams();
    if (opts?.styleId) params.set('styleId', opts.styleId);
    if (opts?.tag) params.set('tag', opts.tag);
    const q = params.toString() ? `?${params}` : '';
    const data = await havenFetch<unknown>(`/room-sets${q}`);
    return itemsOf<Record<string, unknown>>(data)
      .map(mapRoomSet)
      .filter((s) => s.id && s.imageUrl)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getRoomSet(id: string): Promise<RoomSetDetail> {
    const data = await havenFetch<Record<string, unknown>>(
      `/room-sets/${encodeURIComponent(id)}`,
    );
    return mapRoomSetDetail(data);
  }

  async getDemoRoom(): Promise<RoomSetDetail> {
    const res = await fetch(`${HAVEN_BASE}/demo-room`);
    if (res.status === 404) {
      throw new HavenApiError('No demo room set yet.', 404);
    }
    return parseEnvelope<Record<string, unknown>>(res).then(mapRoomSetDetail);
  }

  async upload(file: File): Promise<HavenUpload> {
    const body = new FormData();
    body.append('file', file);
    const data = await havenFetch<Record<string, unknown>>('/uploads', {
      method: 'POST',
      body,
    });
    return {
      uploadId: String(data.uploadId ?? data.upload_id ?? ''),
      originalImageUrl: String(data.originalImageUrl ?? data.original_image_url ?? ''),
      width: Number(data.width ?? 0),
      height: Number(data.height ?? 0),
      aspectRatio: String(data.aspectRatio ?? data.aspect_ratio ?? '16:9'),
    };
  }

  async createJob(
    uploadId: string,
    styleId: StyleId,
    roomSetId?: string,
  ): Promise<{ jobId: string; status: string }> {
    const payload: Record<string, string> = { uploadId, styleId };
    if (roomSetId) payload.roomSetId = roomSetId;
    const data = await havenFetch<Record<string, unknown>>('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return {
      jobId: String(data.jobId ?? data.job_id ?? data.id ?? ''),
      status: String(data.status ?? 'queued'),
    };
  }

  async getJob(jobId: string): Promise<RoomJob> {
    const data = await havenFetch<Record<string, unknown>>(`/jobs/${encodeURIComponent(jobId)}`);
    return mapJob(data);
  }

  async styleRoom(opts: {
    file: File | null;
    previewUrl: string;
    styleId: StyleId;
    roomSetId?: string;
    signal?: AbortSignal;
  }): Promise<RoomJob> {
    const file = opts.file ?? (await fileFromPreviewUrl(opts.previewUrl));
    if (opts.signal?.aborted) throw new Error('Cancelled');

    const upload = await this.upload(file);
    if (!upload.uploadId) throw new Error('Upload failed: missing uploadId.');
    if (opts.signal?.aborted) throw new Error('Cancelled');

    const { jobId } = await this.createJob(upload.uploadId, opts.styleId, opts.roomSetId);
    if (!jobId) throw new Error('Job create failed: missing jobId.');

    const started = Date.now();
    while (Date.now() - started < POLL_MAX_MS) {
      if (opts.signal?.aborted) throw new Error('Cancelled');
      const job = await this.getJob(jobId);
      if (job.status === 'ready') {
        if (!job.originalImageUrl) job.originalImageUrl = upload.originalImageUrl;
        if (!job.aspectRatio) job.aspectRatio = upload.aspectRatio;
        if (!job.imageWidth) job.imageWidth = upload.width;
        if (!job.imageHeight) job.imageHeight = upload.height;
        return job;
      }
      if (job.status === 'failed') {
        throw new Error(job.error || 'Styling failed.');
      }
      await wait(POLL_MS);
    }
    throw new Error('Styling timed out. Try again.');
  }
}

/** Offline fallback when VITE_HAVEN_USE_MOCK=true. */
export class MockHavenClient implements HavenClient {
  private jobs = new Map<string, RoomJob>();

  async listStyles(): Promise<StylePersonality[]> {
    return STYLE_PERSONALITIES;
  }

  async listRoomSets(): Promise<RoomSet[]> {
    return [
      {
        id: 'mock_set_1',
        styleId: 'organic_modern',
        label: 'Calm linen living room',
        blurb: 'Soft neutrals you can shop',
        productIds: [],
        imageUrl: MOCK_ORIGINAL_ROOM,
        hotspots: [],
        tags: ['calm', 'neutral'],
        featured: true,
        aspectRatio: '16:9',
        imageWidth: 1600,
        imageHeight: 900,
      },
    ];
  }

  async getRoomSet(id: string): Promise<RoomSetDetail> {
    const { MOCK_PRODUCTS, MOCK_HOTSPOTS_BY_STYLE } = await import('../mock/room');
    const base = (await this.listRoomSets())[0];
    return {
      ...base,
      id,
      products: MOCK_PRODUCTS,
      hotspots: MOCK_HOTSPOTS_BY_STYLE.organic_modern,
    };
  }

  async getDemoRoom(): Promise<RoomSetDetail> {
    return this.getRoomSet('mock_set_1');
  }

  async upload(_file: File): Promise<HavenUpload> {
    return {
      uploadId: `mock_up_${Date.now()}`,
      originalImageUrl: MOCK_ORIGINAL_ROOM,
      width: 1600,
      height: 900,
      aspectRatio: '16:9',
    };
  }

  async createJob(
    _uploadId: string,
    styleId: StyleId,
    _roomSetId?: string,
  ): Promise<{ jobId: string; status: string }> {
    const { MOCK_NOTES_BY_STYLE, MOCK_PRODUCTS, MOCK_STYLED_BY_STYLE, MOCK_HOTSPOTS_BY_STYLE } =
      await import('../mock/room');
    const jobId = `mock_job_${Date.now()}`;
    const styled = MOCK_STYLED_BY_STYLE[styleId] ?? MOCK_STYLED_BY_STYLE.organic_modern;
    this.jobs.set(jobId, {
      id: jobId,
      styleId,
      originalImageUrl: MOCK_ORIGINAL_ROOM,
      styledImageUrl: styled,
      notes: MOCK_NOTES_BY_STYLE[styleId] ?? MOCK_NOTES_BY_STYLE.organic_modern,
      products: MOCK_PRODUCTS,
      hotspots: MOCK_HOTSPOTS_BY_STYLE[styleId] ?? MOCK_HOTSPOTS_BY_STYLE.organic_modern,
      status: 'ready',
      imageWidth: 1600,
      imageHeight: 900,
      aspectRatio: '16:9',
    });
    return { jobId, status: 'queued' };
  }

  async getJob(jobId: string): Promise<RoomJob> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    return job;
  }

  async styleRoom(opts: {
    file: File | null;
    previewUrl: string;
    styleId: StyleId;
    roomSetId?: string;
  }): Promise<RoomJob> {
    await wait(900);
    const { jobId } = await this.createJob('mock', opts.styleId, opts.roomSetId);
    return this.getJob(jobId);
  }
}

function createHavenClient(): HavenClient {
  const useMock = String(import.meta.env.VITE_HAVEN_USE_MOCK || '').toLowerCase() === 'true';
  return useMock ? new MockHavenClient() : new HttpHavenClient();
}

export const havenClient: HavenClient = createHavenClient();

export function getHavenApiBase(): string {
  return HAVEN_BASE;
}

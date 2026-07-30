import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import { HiOutlineChatBubbleLeftRight, HiOutlineEnvelope } from 'react-icons/hi2';

type HavenShareButtonProps = {
  text: string;
  title?: string;
  url?: string;
  className?: string;
  /** Light glass control for dark media stages */
  variant?: 'default' | 'onMedia';
};

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

const ShareIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    <path
      d="M8.4 10.8 15.6 6.2M8.4 13.2l7.2 4.6"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

function openShareWindow(href: string) {
  window.open(href, '_blank', 'noopener,noreferrer,width=600,height=520');
}

/**
 * Custom share menu (copy link + a few destinations). Avoids OS share sheets.
 */
export const HavenShareButton: React.FC<HavenShareButtonProps> = ({
  text,
  title = 'Haven',
  url,
  className = '',
  variant = 'default',
}) => {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const message = `${text} ${shareUrl}`.trim();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, close]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await copyText(shareUrl);
      setCopied(true);
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }, [shareUrl]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);
  const encodedMessage = encodeURIComponent(message);
  const encodedSubject = encodeURIComponent(title);

  return (
    <div
      ref={rootRef}
      className={`hv-share ${variant === 'onMedia' ? 'hv-share--on-media' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="hv-share__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ShareIcon />
        <span>Share</span>
      </button>

      {open ? (
        <div id={panelId} className="hv-share__panel" role="dialog" aria-label="Share">
          <p className="hv-share__heading">Share</p>
          <div className="hv-share__link-row">
            <input
              className="hv-share__url"
              value={shareUrl}
              readOnly
              aria-label="Link"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" className="hv-share__copy" onClick={() => void onCopy()}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="hv-share__actions">
            <a
              className="hv-share__action hv-share__action--email"
              href={`mailto:?subject=${encodedSubject}&body=${encodedMessage}`}
              aria-label="Email"
              title="Email"
            >
              <HiOutlineEnvelope className="hv-share__icon" aria-hidden />
            </a>
            <a
              className="hv-share__action hv-share__action--text"
              href={`sms:?&body=${encodedMessage}`}
              aria-label="Text"
              title="Text"
            >
              <HiOutlineChatBubbleLeftRight className="hv-share__icon" aria-hidden />
            </a>
            <button
              type="button"
              className="hv-share__action hv-share__action--x"
              aria-label="Share on X"
              title="X"
              onClick={() =>
                openShareWindow(
                  `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
                )
              }
            >
              <FaXTwitter className="hv-share__icon" aria-hidden />
            </button>
            <button
              type="button"
              className="hv-share__action hv-share__action--facebook"
              aria-label="Share on Facebook"
              title="Facebook"
              onClick={() =>
                openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)
              }
            >
              <FaFacebookF className="hv-share__icon" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function toAbsoluteUrl(maybeUrl: string): string {
  try {
    return new URL(maybeUrl, window.location.origin).href;
  } catch {
    return maybeUrl;
  }
}

/** Best-effort client meta (crawlers still need edge OG injection). */
export function applyHavenShareMeta(opts: {
  title: string;
  description: string;
  imageUrl?: string | null;
  url?: string;
}) {
  const pageUrl = opts.url ?? window.location.href;
  const imageUrl = opts.imageUrl?.trim() ? toAbsoluteUrl(opts.imageUrl.trim()) : '';
  document.title = opts.title;
  setMeta('description', opts.description);
  setMeta('og:title', opts.title, true);
  setMeta('og:description', opts.description, true);
  setMeta('og:url', pageUrl, true);
  setMeta('og:type', 'website', true);
  if (imageUrl) {
    setMeta('og:image', imageUrl, true);
  }
  setMeta('twitter:card', imageUrl ? 'summary_large_image' : 'summary');
  setMeta('twitter:title', opts.title);
  setMeta('twitter:description', opts.description);
  if (imageUrl) {
    setMeta('twitter:image', imageUrl);
  }
}

import React from 'react';

const RoyceSlides: React.FC = () => {
  // Add timestamp to bust cache
  const timestamp = Date.now();
  const iframeSrc = `https://docs.google.com/presentation/d/e/2PACX-1vSlH8VfdV9jYTU2fBK6HL32qeM8VIxWPv5qs0WnKXyD5sDYojPxvuov6WKEePeUT9uOciEQ69APG-hf/pubembed?start=true&loop=true&delayms=3000&_cb=${timestamp}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 md:p-8 relative">
      {/* Edit Button */}
      <a
        href="https://docs.google.com/presentation/d/1Uc8THFby-EMjbS0MyOjwkqbz-MAa2JkUmzXG_OnoLrQ/edit?slide=id.p#slide=id.p"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 md:top-6 md:right-6 px-4 py-2 bg-white rounded-lg shadow-md text-slate-600 text-sm font-medium hover:bg-slate-50 hover:shadow-lg hover:text-slate-800 transition-all duration-200 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Slides
      </a>

      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <iframe
            src={iframeSrc}
            frameBorder="0"
            width="100%"
            height="569"
            allowFullScreen={true}
            className="w-full aspect-video"
            style={{ minHeight: '569px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default RoyceSlides;

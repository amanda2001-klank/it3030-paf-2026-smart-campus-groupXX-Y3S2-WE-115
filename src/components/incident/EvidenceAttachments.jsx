import React from 'react';
import AuthenticatedIncidentImage from './AuthenticatedIncidentImage';

const EvidenceAttachments = ({ attachments = [] }) => {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Evidence Attachments</h3>
          <p className="text-xs text-slate-400 mt-1">Photo documentation for this incident</p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-100">
          {attachments.length} {attachments.length === 1 ? 'FILE' : 'FILES'}
        </span>
      </div>
      
      {attachments.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {attachments.map((file) => (
            <div key={file.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition hover:shadow-md">
              <AuthenticatedIncidentImage 
                url={file.path} 
                alt={file.name} 
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 opacity-0 transition duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
                <button 
                  onClick={() => window.open(file.path, '_blank')}
                  className="rounded-xl bg-white/20 p-3 text-white backdrop-blur-md hover:bg-white/40 transition active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <span className="mt-2 text-[8px] font-bold text-white uppercase tracking-widest">View Full</span>
              </div>
            </div>
          ))}
          
          {attachments.length < 3 && (
            <button className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 transition hover:border-blue-300 hover:bg-blue-50 group">
              <div className="rounded-xl bg-white p-2.5 shadow-sm group-hover:scale-110 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="mt-3 text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-600">Add Photo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-50 bg-slate-50/30">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-400">No attachments found</p>
          <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">Reporter did not include photos</p>
        </div>
      )}
    </div>
  );
};

export default EvidenceAttachments;

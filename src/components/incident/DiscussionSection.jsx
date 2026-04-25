import React, { useState } from 'react';

const DiscussionSection = ({ discussions = [], onSendMessage }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onSendMessage(comment);
    setComment('');
  };

  return (
    <div className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Discussion</h3>
        <button className="text-gray-400 hover:text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto mb-6 pr-2 custom-scrollbar">
        {discussions.map((msg, index) => (
          <div key={index} className="flex gap-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${msg.isStaff ? 'bg-blue-600' : 'bg-slate-700'}`}>
              {msg.authorName ? msg.authorName.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-slate-900 truncate">{msg.authorName}</span>
                {msg.isStaff && (
                  <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-blue-100">Staff</span>
                )}
                <span className="text-[10px] font-medium text-slate-400">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
              <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.isStaff ? 'bg-white border border-blue-50 text-slate-700' : 'bg-slate-50 text-slate-700'}`}>
                {msg.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative mt-auto">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-4 pl-6 pr-14 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 transition duration-200"
        />
        <button 
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default DiscussionSection;

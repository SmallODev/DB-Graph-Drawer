import React, { useRef, useState } from 'react';

export default function TableNode({ table, updateTable, removeTable, startConnection, finishConnection, scale, dark, isDrawing }) {
    const draggingRef = useRef(false);
    const offsetRef = useRef({ startX: 0, startY: 0, initialTableX: 0, initialTableY: 0 });
    const [hoveredCol, setHoveredCol] = useState(null);

    const handleMouseDown = (e) => {
        if (e.button === 1) return;
        e.stopPropagation();
        draggingRef.current = true;
        offsetRef.current = { startX: e.clientX, startY: e.clientY, initialTableX: table.x, initialTableY: table.y };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (draggingRef.current) {
            const dx = (e.clientX - offsetRef.current.startX) / scale;
            const dy = (e.clientY - offsetRef.current.startY) / scale;
            updateTable(table.id, { x: offsetRef.current.initialTableX + dx, y: offsetRef.current.initialTableY + dy });
        }
    };

    const handleMouseUp = () => {
        draggingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    const headerBg = dark ? `${table.color}22` : `${table.color}33`;

    return (
        <div className="absolute w-[220px] rounded-md border border-slate-200 dark:border-[#2d2d3f] bg-white dark:bg-[#0d0d14] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] select-none z-10 text-slate-800 dark:text-slate-200 overflow-hidden font-inherit" style={{ left: table.x, top: table.y }}>
            <div onMouseDown={handleMouseDown} className="px-3 font-semibold text-xs border-b border-slate-200 dark:border-[#2d2d3f] cursor-grab h-[37px] flex items-center justify-between box-border" style={{ backgroundColor: headerBg, borderTop: `3px solid ${table.color}` }}>
                <span>{table.name}</span>
                <button onMouseDown={(e) => e.stopPropagation()} onClick={() => removeTable(table.id)} className="text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
            <div className="p-0">
                {table.columns.map((col, index) => {
                    const isHovered = isDrawing && hoveredCol === col.id;
                    const bgClass = isHovered
                        ? 'bg-purple-100 dark:bg-[#2d2d44]'
                        : (index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50 dark:bg-[#151520]');

                    return (
                        <div
                            key={col.id}
                            onMouseUp={(e) => finishConnection(table.id, col.id, 'auto', e)}
                            onMouseEnter={() => setHoveredCol(col.id)}
                            onMouseLeave={() => setHoveredCol(null)}
                            className={`relative flex justify-between items-center px-3 h-[30px] box-border text-[0.72rem] transition-colors duration-75 ${bgClass}`}
                        >
                            <div onMouseDown={(e) => startConnection(table.id, col.id, 'auto', e)} className="absolute flex items-center justify-center w-8 h-8 cursor-crosshair top-1/2 -translate-y-1/2 pointer-events-auto -left-4 z-20"><div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-[#0d0d14] border-2 border-slate-400 dark:border-[#4c4f7a] box-border" /></div>
                            <span className="font-medium pointer-events-none">{col.name}</span>
                            <span className="text-slate-500 dark:text-slate-400 pointer-events-none">{col.type}</span>
                            <div onMouseDown={(e) => startConnection(table.id, col.id, 'auto', e)} className="absolute flex items-center justify-center w-8 h-8 cursor-crosshair top-1/2 -translate-y-1/2 pointer-events-auto -right-4 z-20"><div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-[#0d0d14] border-2 border-slate-400 dark:border-[#4c4f7a] box-border" /></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
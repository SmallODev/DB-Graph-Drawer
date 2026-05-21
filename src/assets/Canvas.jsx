import React, { useState, useRef, useEffect } from 'react';
import TableNode from './TableNode';

export default function Canvas({ tables, updateTable, removeTable, connections, setConnections, dark }) {
    const [drawing, setDrawing] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [history, setHistory] = useState(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState(null);
    const panRef = useRef({ startX: 0, startY: 0, initTx: 0, initTy: 0 });

    useEffect(() => {
        const handleKeyDown = (e) => { if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) { setConnections(prev => prev.filter(c => c.id !== selectedConnectionId)); setSelectedConnectionId(null); } };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedConnectionId, setConnections]);

    const handleMouseDown = (e) => { setSelectedConnectionId(null); if (e.button === 1) { e.preventDefault(); setIsPanning(true); panRef.current = { startX: e.clientX, startY: e.clientY, initTx: transform.x, initTy: transform.y }; } };
    const handleMouseMove = (e) => { if (isPanning) setTransform(prev => ({ ...prev, x: panRef.current.initTx + (e.clientX - panRef.current.startX), y: panRef.current.initTy + (e.clientY - panRef.current.startY) })); if (drawing) { const rect = e.currentTarget.getBoundingClientRect(); setMousePos({ x: (e.clientX - rect.left - transform.x) / transform.scale, y: (e.clientY - rect.top - transform.y) / transform.scale }); } };
    const handleMouseUp = (e) => { if (e.button === 1) setIsPanning(false); setDrawing(null); };
    const handleWheel = (e) => { const delta = -e.deltaY * 0.001; let newScale = Math.max(0.1, Math.min(transform.scale * Math.exp(delta), 5)); const rect = e.currentTarget.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; setTransform({ x: mouseX - (mouseX - transform.x) * (newScale / transform.scale), y: mouseY - (mouseY - transform.y) * (newScale / transform.scale), scale: newScale }); };

    const startConnection = (tableId, colId, side, e) => { e.stopPropagation(); const rect = e.target.closest('#canvas-container').getBoundingClientRect(); setDrawing({ tableId, colId, side, startX: (e.clientX - rect.left - transform.x) / transform.scale, startY: (e.clientY - rect.top - transform.y) / transform.scale }); };
    const finishConnection = (tableId, colId, side, e) => { e.stopPropagation(); if (drawing && (drawing.tableId !== tableId || drawing.colId !== colId)) setConnections(prev => [...prev, { id: `conn_${Math.random().toString(36).substring(2, 9)}`, fromTable: drawing.tableId, fromCol: drawing.colId, fromSide: 'auto', toTable: tableId, toCol: colId, toSide: 'auto' }]); setDrawing(null); };

    const handleAutoLayout = (e) => {
        e.stopPropagation();
        setHistory(tables.map(t => ({ id: t.id, x: t.x, y: t.y })));

        // Build adjacency and compute levels (longest path layering)
        const adj = {}; const radj = {}; const inDegree = {};
        tables.forEach(t => { adj[t.id] = []; radj[t.id] = []; inDegree[t.id] = 0; });
        (connections ?? []).forEach(c => {
            if (adj[c.fromTable] && adj[c.toTable] && c.fromTable !== c.toTable) {
                adj[c.fromTable].push(c.toTable);
                radj[c.toTable].push(c.fromTable);
                inDegree[c.toTable] += 1;
            }
        });

        // Kahn's topological sort for level assignment
        const levels = {};
        let queue = tables.filter(t => inDegree[t.id] === 0).map(t => t.id);
        if (queue.length === 0 && tables.length > 0) queue = [tables[0].id];
        queue.forEach(id => { levels[id] = 0; });
        const topoQueue = [...queue];
        while (topoQueue.length > 0) {
            const id = topoQueue.shift();
            (adj[id] || []).forEach(nid => {
                levels[nid] = Math.max(levels[nid] ?? 0, (levels[id] ?? 0) + 1);
                inDegree[nid]--;
                if (inDegree[nid] <= 0) topoQueue.push(nid);
            });
        }
        tables.forEach(t => { if (levels[t.id] === undefined) levels[t.id] = 0; });

        // Group by level
        const levelGroups = {};
        Object.keys(levels).forEach(id => {
            const lvl = levels[id];
            if (!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(id);
        });

        // Barycenter crossing minimisation — sort nodes in each column by
        // the average position (index) of their neighbours in the previous column
        const sortedLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
        sortedLevels.forEach((lvl, li) => {
            if (li === 0) return;
            const prevGroup = levelGroups[sortedLevels[li - 1]];
            const prevPos = {};
            prevGroup.forEach((id, i) => { prevPos[id] = i; });
            levelGroups[lvl].sort((a, b) => {
                const parentsA = (radj[a] || []).map(p => prevPos[p] ?? 0);
                const parentsB = (radj[b] || []).map(p => prevPos[p] ?? 0);
                const avgA = parentsA.length ? parentsA.reduce((s, v) => s + v, 0) / parentsA.length : 0;
                const avgB = parentsB.length ? parentsB.reduce((s, v) => s + v, 0) / parentsB.length : 0;
                return avgA - avgB;
            });
        });

        // Position tables — extra horizontal gap so orthogonal connectors have room
        const COL_GAP = 380;
        const ROW_GAP = 60;
        sortedLevels.forEach(lvl => {
            const x = 80 + lvl * COL_GAP;
            let currentY = 80;
            levelGroups[lvl].forEach(id => {
                updateTable(id, { x, y: currentY });
                const table = tables.find(t => t.id === id);
                const tableHeight = table ? 37 + ((table.columns?.length ?? 0) * 30) : 100;
                currentY += tableHeight + ROW_GAP;
            });
        });
    };

    const handleUndo = (e) => { e.stopPropagation(); if (!history) return; history.forEach(h => updateTable(h.id, { x: h.x, y: h.y })); setHistory(null); };

    const getDotCoords = (tableId, colId, side) => {
        const table = tables.find(t => t.id === tableId);
        if (!table) return { x: 0, y: 0 };
        const colIndex = (table.columns ?? []).findIndex(c => c.id === colId);
        if (colIndex === -1) return { x: 0, y: 0 };
        return { x: side === 'left' ? table.x : table.x + 220, y: table.y + 37 + (colIndex * 30) + 15 };
    };

    // Orthogonal path: exit horizontally, jog vertically at midpoint, enter horizontally
    // Uses SVG arc for rounded corners (r=8px)
    const getOrthogonalPath = (x1, y1, side1, x2, y2, side2) => {
        const r = 8; // corner radius
        const stub = 24; // minimum horizontal stub before turning
        const dx = x2 - x1;
        // midX: halfway between the two stubs
        const exit1 = side1 === 'right' ? x1 + stub : x1 - stub;
        const exit2 = side2 === 'right' ? x2 + stub : x2 - stub;
        const midX = (exit1 + exit2) / 2;

        // Clamp corner radius so it never exceeds half the segment length
        const hSeg = Math.abs(midX - exit1);
        const vSeg = Math.abs(y2 - y1);
        const rc = Math.min(r, hSeg / 2, vSeg / 2);

        if (vSeg < 1) {
            // Straight horizontal line — no jog needed
            return `M ${x1} ${y1} L ${x2} ${y2}`;
        }

        // Direction helpers
        const hDir1 = exit1 > x1 ? 1 : -1;   // +1 going right, -1 going left
        const hDir2 = exit2 > midX ? 1 : -1;
        const vDir = y2 > y1 ? 1 : -1;

        // Corner arcs — sweep-flag encodes turn direction
        // Turn 1: horizontal→vertical at (midX, y1)
        const sf1 = (hDir1 > 0 && vDir > 0) || (hDir1 < 0 && vDir < 0) ? 1 : 0;
        // Turn 2: vertical→horizontal at (midX, y2)
        const sf2 = (vDir > 0 && hDir2 > 0) || (vDir < 0 && hDir2 < 0) ? 1 : 0;

        return [
            `M ${x1} ${y1}`,
            `L ${midX - hDir1 * rc} ${y1}`,
            `A ${rc} ${rc} 0 0 ${sf1} ${midX} ${y1 + vDir * rc}`,
            `L ${midX} ${y2 - vDir * rc}`,
            `A ${rc} ${rc} 0 0 ${sf2} ${midX + hDir2 * rc} ${y2}`,
            `L ${x2} ${y2}`,
        ].join(' ');
    };

    const getOrthogonalMidpoint = (x1, y1, side1, x2, y2) => {
        const stub = 24;
        const exit1 = side1 === 'right' ? x1 + stub : x1 - stub;
        const exit2 = side1 === 'right' ? x2 - stub : x2 + stub;
        const midX = (exit1 + exit2) / 2;
        return { x: midX, y: (y1 + y2) / 2 };
    };

    const connColor = dark ? '#4c4f7a' : '#94a3b8';
    const selectedColor = '#ef4444';
    const dotColor = dark ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.35)';

    return (
        <div id="canvas-container" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} onMouseLeave={() => setIsPanning(false)} tabIndex={0} className={`flex-1 relative overflow-hidden outline-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'} ${dark ? 'bg-[#09090f]' : 'bg-slate-100'}`}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`, backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`, backgroundPosition: `${transform.x}px ${transform.y}px` }} />

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
                {history && (
                    <button onMouseDown={handleUndo} title="Undo Layout" className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#14141f] border border-slate-200 dark:border-[#2a2a3d] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e1e2e] shadow-lg transition-all hover:scale-105">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                    </button>
                )}
                <button onMouseDown={handleAutoLayout} title="Auto Layout" className="w-11 h-11 rounded-full flex items-center justify-center bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-lg shadow-violet-500/30 transition-all hover:scale-105">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </button>
            </div>

            <div className="absolute bottom-4 right-4 px-2 py-0.5 text-[0.65rem] tracking-wider rounded-md font-inherit z-10 border border-slate-200 dark:border-[#2a2a3d] bg-white/80 dark:bg-[#14141f]/80 text-slate-400 dark:text-slate-500 backdrop-blur-sm">
                {Math.round(transform.scale * 100)}%
            </div>

            <div style={{ position: 'absolute', transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0', width: '100%', height: '100%', pointerEvents: 'none' }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 0 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill={connColor} /></marker>
                        <marker id="arrowhead-selected" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill={selectedColor} /></marker>
                    </defs>
                    {(connections ?? []).map(conn => {
                        const fromTable = tables.find(t => t.id === conn.fromTable);
                        const toTable = tables.find(t => t.id === conn.toTable);
                        if (!fromTable || !toTable) return null;
                        const fromIsLeft = fromTable.x < toTable.x;
                        const fromSide = fromIsLeft ? 'right' : 'left';
                        const toSide = fromIsLeft ? 'left' : 'right';
                        const start = getDotCoords(conn.fromTable, conn.fromCol, fromSide);
                        const end = getDotCoords(conn.toTable, conn.toCol, toSide);
                        const isSelected = selectedConnectionId === conn.id;
                        const pathData = getOrthogonalPath(start.x, start.y, fromSide, end.x, end.y, toSide);
                        return (
                            <g key={conn.id}>
                                <path d={pathData} fill="none" stroke="transparent" strokeWidth="14" style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onMouseDown={(e) => { e.stopPropagation(); setSelectedConnectionId(conn.id); }} />
                                <path d={pathData} fill="none" stroke={isSelected ? selectedColor : connColor} strokeWidth={isSelected ? '2' : '1.5'} markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`} style={{ pointerEvents: 'none' }} />
                            </g>
                        );
                    })}
                    {drawing && (() => {
                        const fromTable = tables.find(t => t.id === drawing.tableId);
                        if (!fromTable) return null;
                        const fromIsLeft = fromTable.x + 110 < mousePos.x;
                        const fromSide = fromIsLeft ? 'right' : 'left';
                        const toSide = fromIsLeft ? 'left' : 'right';
                        const start = getDotCoords(drawing.tableId, drawing.colId, fromSide);
                        return <path d={getOrthogonalPath(start.x, start.y, fromSide, mousePos.x, mousePos.y, toSide)} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="6,4" />;
                    })()}
                </svg>

                <div style={{ pointerEvents: 'auto' }}>
                    {(connections ?? []).map(conn => {
                        if (selectedConnectionId !== conn.id) return null;
                        const fromTable = tables.find(t => t.id === conn.fromTable);
                        const toTable = tables.find(t => t.id === conn.toTable);
                        if (!fromTable || !toTable) return null;
                        const fromIsLeft = fromTable.x < toTable.x;
                        const fromSide = fromIsLeft ? 'right' : 'left';
                        const start = getDotCoords(conn.fromTable, conn.fromCol, fromSide);
                        const end = getDotCoords(conn.toTable, conn.toCol, fromIsLeft ? 'left' : 'right');
                        const mid = getOrthogonalMidpoint(start.x, start.y, fromSide, end.x, end.y);
                        return (
                            <div key={`btn-${conn.id}`} className="absolute flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full cursor-pointer z-50 shadow-md transition-colors" style={{ left: mid.x, top: mid.y, transform: 'translate(-50%, -50%)' }} onMouseDown={(e) => { e.stopPropagation(); setConnections(prev => prev.filter(c => c.id !== conn.id)); setSelectedConnectionId(null); }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </div>
                        );
                    })}
                    {(tables ?? []).map(table => <TableNode key={table.id} table={table} updateTable={updateTable} removeTable={removeTable} startConnection={startConnection} finishConnection={finishConnection} scale={transform.scale} dark={dark} isDrawing={!!drawing} />)}
                </div>
            </div>
        </div>
    );
}
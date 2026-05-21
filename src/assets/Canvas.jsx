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
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
                setConnections(prev => prev.filter(c => c.id !== selectedConnectionId));
                setSelectedConnectionId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedConnectionId, setConnections]);

    const handleMouseDown = (e) => {
        setSelectedConnectionId(null);
        if (e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            panRef.current = { startX: e.clientX, startY: e.clientY, initTx: transform.x, initTy: transform.y };
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            setTransform(prev => ({ ...prev, x: panRef.current.initTx + (e.clientX - panRef.current.startX), y: panRef.current.initTy + (e.clientY - panRef.current.startY) }));
        }
        if (drawing) {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: (e.clientX - rect.left - transform.x) / transform.scale, y: (e.clientY - rect.top - transform.y) / transform.scale });
        }
    };

    const handleMouseUp = (e) => {
        if (e.button === 1) setIsPanning(false);
        setDrawing(null);
    };

    const handleWheel = (e) => {
        const delta = -e.deltaY * 0.001;
        let newScale = Math.max(0.1, Math.min(transform.scale * Math.exp(delta), 5));
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setTransform({ x: mouseX - (mouseX - transform.x) * (newScale / transform.scale), y: mouseY - (mouseY - transform.y) * (newScale / transform.scale), scale: newScale });
    };

    const startConnection = (tableId, colId, side, e) => {
        e.stopPropagation();
        const rect = e.target.closest('#canvas-container').getBoundingClientRect();
        setDrawing({ tableId, colId, side, startX: (e.clientX - rect.left - transform.x) / transform.scale, startY: (e.clientY - rect.top - transform.y) / transform.scale });
    };

    const finishConnection = (tableId, colId, side, e) => {
        e.stopPropagation();
        if (drawing && (drawing.tableId !== tableId || drawing.colId !== colId)) {
            setConnections(prev => [...prev, { id: `conn_${Math.random().toString(36).substring(2, 9)}`, fromTable: drawing.tableId, fromCol: drawing.colId, fromSide: 'auto', toTable: tableId, toCol: colId, toSide: 'auto' }]);
        }
        setDrawing(null);
    };

    const handleAutoLayout = (e) => {
        e.stopPropagation();
        setHistory(tables.map(t => ({ id: t.id, x: t.x, y: t.y })));

        const adj = {};
        const inDegree = {};
        tables.forEach(t => { adj[t.id] = []; inDegree[t.id] = 0; });

        connections.forEach(c => {
            if (adj[c.fromTable] && adj[c.toTable]) {
                adj[c.fromTable].push(c.toTable);
                inDegree[c.toTable] += 1;
            }
        });

        const levels = {};
        const visited = new Set();
        let queue = tables.filter(t => inDegree[t.id] === 0).map(t => ({ id: t.id, depth: 0 }));

        if (queue.length === 0 && tables.length > 0) queue.push({ id: tables[0].id, depth: 0 });

        while (queue.length > 0) {
            const curr = queue.shift();
            levels[curr.id] = Math.max(levels[curr.id] || 0, curr.depth);
            visited.add(curr.id);

            (adj[curr.id] || []).forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    queue.push({ id: neighbor, depth: curr.depth + 1 });
                }
            });
        }

        tables.forEach(t => {
            if (!visited.has(t.id)) levels[t.id] = 0;
        });

        const levelGroups = {};
        Object.keys(levels).forEach(id => {
            const lvl = levels[id];
            if (!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(id);
        });

        Object.keys(levelGroups).forEach(lvl => {
            const x = 100 + parseInt(lvl) * 350;
            let currentY = 100;

            levelGroups[lvl].forEach((id) => {
                updateTable(id, { x, y: currentY });
                const table = tables.find(t => t.id === id);
                const tableHeight = table ? 37 + (table.columns.length * 30) : 100;
                currentY += tableHeight + 50;
            });
        });
    };

    const handleUndo = (e) => {
        e.stopPropagation();
        if (!history) return;
        history.forEach(h => updateTable(h.id, { x: h.x, y: h.y }));
        setHistory(null);
    };

    const getDotCoords = (tableId, colId, side) => {
        const table = tables.find(t => t.id === tableId);
        if (!table) return { x: 0, y: 0 };
        const colIndex = table.columns.findIndex(c => c.id === colId);
        if (colIndex === -1) return { x: 0, y: 0 };
        return { x: side === 'left' ? table.x : table.x + 220, y: table.y + 37 + (colIndex * 30) + 15 };
    };

    const getCurve = (x1, y1, side1, x2, y2, side2) => {
        const offset = Math.max(Math.abs(x2 - x1) * 0.5, 50);
        const c1x = side1 === 'right' ? x1 + offset : x1 - offset;
        const c2x = side2 === 'right' ? x2 + offset : x2 - offset;
        return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
    };

    const getCurveMidpoint = (x1, y1, side1, x2, y2, side2) => {
        const offset = Math.max(Math.abs(x2 - x1) * 0.5, 50);
        const c1x = side1 === 'right' ? x1 + offset : x1 - offset;
        const c2x = side2 === 'right' ? x2 + offset : x2 - offset;
        const midX = 0.125 * x1 + 0.375 * c1x + 0.375 * c2x + 0.125 * x2;
        const midY = 0.5 * y1 + 0.5 * y2;
        return { x: midX, y: midY };
    };

    const canvasBg = dark ? '#0a0a10' : '#f1f5f9';
    const dotColor = dark ? 'rgba(99,102,241,0.25)' : 'rgba(148,163,184,0.4)';
    const connColor = dark ? '#4c4f7a' : '#94a3b8';
    const selectedColor = '#ef4444';

    return (
        <div id="canvas-container" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} onMouseLeave={() => setIsPanning(false)} style={{ flex: 1, position: 'relative', backgroundColor: canvasBg, overflow: 'hidden', cursor: isPanning ? 'grabbing' : 'default', outline: 'none' }} tabIndex={0}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`, backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`, backgroundPosition: `${transform.x}px ${transform.y}px`, pointerEvents: 'none' }} />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                {history && (
                    <button onMouseDown={handleUndo} title="Undo Layout" className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#2d2d3f] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2d2d3f] shadow-lg transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
                    </button>
                )}
                <button onMouseDown={handleAutoLayout} title="Auto Layout" className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white shadow-[0_4px_14px_rgba(124,58,237,0.4)] transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
            </div>

            <div className="absolute bottom-4 right-4 px-2.5 py-1 text-[0.68rem] tracking-wider rounded-md font-inherit z-10 border border-slate-200 dark:border-[#2d2d3f] bg-slate-200 dark:bg-[#1a1a2e] text-slate-500 dark:text-slate-400">
                {Math.round(transform.scale * 100)}%
            </div>

            <div style={{ position: 'absolute', transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0', width: '100%', height: '100%', pointerEvents: 'none' }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 0 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill={connColor} />
                        </marker>
                        <marker id="arrowhead-selected" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill={selectedColor} />
                        </marker>
                    </defs>
                    {connections.map(conn => {
                        const fromTable = tables.find(t => t.id === conn.fromTable);
                        const toTable = tables.find(t => t.id === conn.toTable);
                        if (!fromTable || !toTable) return null;

                        const fromIsLeft = fromTable.x < toTable.x;
                        const fromSide = fromIsLeft ? 'right' : 'left';
                        const toSide = fromIsLeft ? 'left' : 'right';

                        const start = getDotCoords(conn.fromTable, conn.fromCol, fromSide);
                        const end = getDotCoords(conn.toTable, conn.toCol, toSide);
                        const isSelected = selectedConnectionId === conn.id;
                        const curveData = getCurve(start.x, start.y, fromSide, end.x, end.y, toSide);

                        return (
                            <g key={conn.id}>
                                <path
                                    d={curveData}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="15"
                                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                                    onMouseDown={(e) => { e.stopPropagation(); setSelectedConnectionId(conn.id); }}
                                />
                                <path
                                    d={curveData}
                                    fill="none"
                                    stroke={isSelected ? selectedColor : connColor}
                                    strokeWidth={isSelected ? "2.5" : "1.5"}
                                    markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`}
                                    style={{ pointerEvents: 'none' }}
                                />
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

                        return (
                            <path d={getCurve(start.x, start.y, fromSide, mousePos.x, mousePos.y, toSide)}
                                  fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="6,4" />
                        );
                    })()}
                </svg>

                <div style={{ pointerEvents: 'auto' }}>
                    {connections.map(conn => {
                        if (selectedConnectionId !== conn.id) return null;
                        const fromTable = tables.find(t => t.id === conn.fromTable);
                        const toTable = tables.find(t => t.id === conn.toTable);
                        if (!fromTable || !toTable) return null;

                        const fromIsLeft = fromTable.x < toTable.x;
                        const fromSide = fromIsLeft ? 'right' : 'left';
                        const toSide = fromIsLeft ? 'left' : 'right';

                        const start = getDotCoords(conn.fromTable, conn.fromCol, fromSide);
                        const end = getDotCoords(conn.toTable, conn.toCol, toSide);
                        const mid = getCurveMidpoint(start.x, start.y, fromSide, end.x, end.y, toSide);

                        return (
                            <div
                                key={`btn-${conn.id}`}
                                className="absolute flex items-center justify-center w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full cursor-pointer z-50 shadow-md transition-colors"
                                style={{ left: mid.x, top: mid.y, transform: 'translate(-50%, -50%)' }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setConnections(prev => prev.filter(c => c.id !== conn.id));
                                    setSelectedConnectionId(null);
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </div>
                        );
                    })}

                    {tables.map(table => (
                        <TableNode key={table.id} table={table} updateTable={updateTable} removeTable={removeTable} startConnection={startConnection} finishConnection={finishConnection} scale={transform.scale} dark={dark} isDrawing={!!drawing} />
                    ))}
                </div>
            </div>
        </div>
    );
}
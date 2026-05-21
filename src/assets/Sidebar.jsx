import React, { useState, useEffect } from 'react';

const DATATYPES = ['bigint', 'boolean', 'date', 'datetime', 'decimal', 'double', 'float', 'integer', 'json', 'text', 'timestamp', 'uuid', 'varchar', 'blob'];

function DatatypeSearch({ value, onChange, onEnterWhenClosed, dark }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => { setQuery(value); }, [value]);

    const filtered = DATATYPES.filter(d => d.includes(query.toLowerCase()));

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setIsOpen(true); setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => Math.max(prev - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (isOpen && filtered.length > 0) { const sel = filtered[highlightedIndex]; setQuery(sel); onChange(sel); setIsOpen(false); } else { onChange(query); onEnterWhenClosed(); } }
        else if (e.key === 'Escape') setIsOpen(false);
        else if (e.key === 'Tab') { setIsOpen(false); onChange(query); }
    };

    return (
        <div className="relative w-[38%]">
            <input value={query} onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setHighlightedIndex(0); }} onKeyDown={handleKeyDown} onFocus={(e) => { setIsOpen(true); e.target.select(); }} onBlur={() => { setTimeout(() => setIsOpen(false), 150); onChange(query); }} className="w-full box-border bg-slate-100 dark:bg-[#0d0d16] border border-slate-200 dark:border-[#2a2a3d] rounded text-violet-600 dark:text-violet-400 px-1.5 py-0.5 text-[0.7rem] font-inherit outline-none focus:border-violet-400 dark:focus:border-violet-600 transition-colors" />
            {isOpen && filtered.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white dark:bg-[#14141f] border border-slate-200 dark:border-[#2a2a3d] list-none p-0 m-0 max-h-[140px] overflow-y-auto z-[200] shadow-xl rounded-md">
                    {filtered.map((type, idx) => (
                        <li key={type} onMouseDown={() => { setQuery(type); onChange(type); setIsOpen(false); }} onMouseEnter={() => setHighlightedIndex(idx)} className={`px-2.5 py-1.5 cursor-pointer text-[0.7rem] font-inherit transition-colors ${idx === highlightedIndex ? 'bg-violet-50 dark:bg-[#2a2a3d] text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {type}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Sidebar({ tables, updateTable, addTable, removeTable, removeColumn, graphName, setGraphName, saveGraph, loadGraph, deleteGraph, savedGraphs, loadSelection, setLoadSelection, dark, setDark }) {
    const addColumn = (table) => { const newCol = { id: `c_${Math.random().toString(36).substring(2, 9)}`, name: 'new_column', type: 'varchar', isNew: true }; updateTable(table.id, { columns: [...table.columns, newCol] }); };
    const updateColumn = (table, colId, key, value) => { updateTable(table.id, { columns: table.columns.map(col => col.id === colId ? { ...col, [key]: value } : col) }); };

    return (
        <div className="w-[272px] min-w-[272px] bg-white dark:bg-[#0d0d14] border-r border-slate-200 dark:border-[#1a1a2a] flex flex-col overflow-hidden font-inherit">
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-[#1a1a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                    <span className="font-semibold text-[0.8rem] text-slate-800 dark:text-slate-100 tracking-widest uppercase">Schema</span>
                    <span className="font-light text-[0.8rem] text-violet-500 tracking-widest uppercase">Builder</span>
                </div>
                <button onClick={() => setDark(!dark)} className={`relative w-11 h-5.5 rounded-full cursor-pointer border transition-all ${dark ? 'bg-violet-900/50 border-violet-700/50' : 'bg-slate-200 border-slate-300'}`} style={{ height: '22px' }}>
                    <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] transition-all duration-200 ${dark ? 'left-[24px] bg-violet-500' : 'left-[2px] bg-slate-400'}`}>{dark ? '🌙' : '☀'}</div>
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-3.5 space-y-4">
                <div>
                    <p className="text-[0.6rem] font-semibold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-2">Save / Load</p>
                    <div className="flex gap-1.5 mb-2">
                        <input value={graphName} onChange={(e) => setGraphName(e.target.value)} placeholder="schema name" className="flex-1 bg-slate-50 dark:bg-[#0d0d16] border border-slate-200 dark:border-[#2a2a3d] rounded-md text-slate-800 dark:text-slate-200 px-2 py-1.5 text-[0.72rem] font-inherit outline-none focus:border-violet-400 dark:focus:border-violet-600 transition-colors placeholder-slate-400 dark:placeholder-slate-600" />
                        <button onClick={saveGraph} className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 border-none rounded-md text-white px-3 py-1.5 text-[0.7rem] font-inherit cursor-pointer font-semibold tracking-wide transition-colors">Save</button>
                    </div>
                    <div className="flex gap-1.5">
                        <select value={loadSelection} onChange={(e) => setLoadSelection(e.target.value)} className="flex-1 bg-slate-50 dark:bg-[#0d0d16] border border-slate-200 dark:border-[#2a2a3d] rounded-md text-slate-800 dark:text-slate-200 px-2 py-1.5 text-[0.72rem] font-inherit outline-none focus:border-violet-400 dark:focus:border-violet-600 transition-colors cursor-pointer">
                            <option value="">select schema...</option>
                            {savedGraphs.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <button onClick={loadGraph} className="bg-slate-100 dark:bg-[#1a1a28] hover:bg-slate-200 dark:hover:bg-[#232336] border border-slate-200 dark:border-[#2a2a3d] rounded-md text-slate-700 dark:text-slate-300 px-3 py-1.5 text-[0.7rem] font-inherit cursor-pointer font-medium transition-colors">Load</button>
                        <button onClick={deleteGraph} className="bg-slate-100 dark:bg-[#1a1a28] hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-[#2a2a3d] hover:border-red-300 dark:hover:border-red-800 rounded-md text-red-400 px-2.5 py-1.5 cursor-pointer transition-colors flex items-center">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-[#1a1a2a]" />

                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[0.6rem] font-semibold text-slate-400 dark:text-slate-500 tracking-widest uppercase m-0">Tables</p>
                        <button onClick={addTable} className="flex items-center gap-1 bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-dashed border-slate-300 dark:border-[#2a2a3d] hover:border-violet-400 dark:hover:border-violet-700 rounded-md text-violet-600 dark:text-violet-400 px-2.5 py-1 text-[0.68rem] font-inherit cursor-pointer transition-colors">
                            <span className="text-base leading-none">+</span> table
                        </button>
                    </div>
                    <div className="space-y-2">
                        {tables.map(table => <SidebarItem key={table.id} table={table} updateTable={updateTable} removeTable={removeTable} updateColumn={updateColumn} addColumn={addColumn} removeColumn={removeColumn} dark={dark} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarItem({ table, updateTable, removeTable, updateColumn, addColumn, removeColumn, dark }) {
    const [collapsed, setCollapsed] = useState(false);
    const [editingName, setEditingName] = useState(table.isNew || false);

    const handleDoubleClick = (e) => { e.stopPropagation(); setEditingName(true); setCollapsed(false); };
    const handleClick = () => { if (!editingName) setCollapsed(!collapsed); };
    const handleKeyDown = (e) => { if (e.key === 'Enter') setEditingName(false); };

    return (
        <div className="border border-slate-200 dark:border-[#1e1e2e] rounded-lg overflow-visible bg-white dark:bg-[#0d0d16]">
            <div onClick={handleClick} className={`px-2.5 py-2 cursor-pointer flex items-center gap-2 ${collapsed ? 'rounded-lg' : 'rounded-t-lg border-b border-slate-200 dark:border-[#1e1e2e]'} transition-colors`} style={{ background: table.color + (dark ? '18' : '22'), borderTop: `2px solid ${table.color}` }}>
                <span className="text-[0.6rem] opacity-50">{collapsed ? '▶' : '▼'}</span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: table.color }} />
                {editingName ? (
                    <input autoFocus={table.isNew || false} value={table.name} onChange={(e) => updateTable(table.id, { name: e.target.value })} onBlur={() => setEditingName(false)} onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()} onFocus={(e) => e.target.select()} className="flex-1 font-semibold box-border bg-white/10 dark:bg-white/5 border rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 text-[0.72rem] font-inherit outline-none" style={{ borderColor: table.color + '66' }} />
                ) : (
                    <div onDoubleClick={handleDoubleClick} className="font-semibold text-[0.72rem] text-slate-800 dark:text-slate-100 select-none flex-1 truncate">{table.name}</div>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeTable(table.id); }} className="text-red-400 hover:text-red-500 opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer p-0.5 flex items-center transition-all">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
            {!collapsed && (
                <div className="p-2 space-y-1">
                    {table.columns.map(col => (
                        <div key={col.id} className="flex gap-1.5 items-center">
                            <input autoFocus={col.isNew || false} value={col.name} onChange={(e) => updateColumn(table, col.id, 'name', e.target.value)} onFocus={(e) => e.target.select()} className="flex-1 bg-slate-50 dark:bg-[#0d0d16] border border-slate-200 dark:border-[#2a2a3d] rounded text-slate-700 dark:text-slate-300 px-1.5 py-0.5 text-[0.7rem] font-inherit outline-none box-border focus:border-violet-400 dark:focus:border-violet-600 transition-colors" />
                            <DatatypeSearch value={col.type} onChange={(val) => updateColumn(table, col.id, 'type', val)} onEnterWhenClosed={() => addColumn(table)} dark={dark} />
                            <button onClick={() => removeColumn(table.id, col.id)} className="text-red-400 hover:text-red-500 opacity-50 hover:opacity-100 bg-transparent border-none cursor-pointer p-0.5 flex items-center transition-all">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => addColumn(table)} className="mt-1.5 w-full cursor-pointer bg-transparent hover:bg-slate-50 dark:hover:bg-[#13131e] border border-dashed border-slate-200 dark:border-[#2a2a3d] hover:border-violet-300 dark:hover:border-violet-800 rounded text-slate-400 dark:text-slate-600 hover:text-violet-500 dark:hover:text-violet-500 py-1 text-[0.65rem] font-inherit transition-all">
                        + column
                    </button>
                </div>
            )}
        </div>
    );
}
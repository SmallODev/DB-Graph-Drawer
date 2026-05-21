import React, { useState, useEffect } from 'react';

const DATATYPES = [
    'bigint', 'boolean', 'date', 'datetime', 'decimal', 'double',
    'float', 'integer', 'json', 'text', 'timestamp', 'uuid', 'varchar', 'blob'
];

function DatatypeSearch({ value, onChange, onEnterWhenClosed, dark }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => { setQuery(value); }, [value]);

    const filtered = DATATYPES.filter(d => d.includes(query.toLowerCase()));

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setIsOpen(true); setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => Math.max(prev - 1, 0)); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen && filtered.length > 0) { const sel = filtered[highlightedIndex]; setQuery(sel); onChange(sel); setIsOpen(false); }
            else { onChange(query); onEnterWhenClosed(); }
        } else if (e.key === 'Escape') { setIsOpen(false); }
        else if (e.key === 'Tab') { setIsOpen(false); onChange(query); }
    };

    const bg = dark ? '#1a1a2e' : '#ffffff';
    const border = dark ? '#2d2d3f' : '#e2e8f0';
    const text = dark ? '#a78bfa' : '#6d28d9';

    return (
        <div style={{ position: 'relative', width: '38%' }}>
            <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setHighlightedIndex(0); }}
                onKeyDown={handleKeyDown}
                onFocus={(e) => { setIsOpen(true); e.target.select(); }}
                onBlur={() => { setTimeout(() => setIsOpen(false), 150); onChange(query); }}
                style={{ width: '100%', boxSizing: 'border-box', background: dark ? '#12121a' : '#f8fafc', border: `1px solid ${border}`, borderRadius: '4px', color: text, padding: '3px 6px', fontSize: '0.72rem', fontFamily: 'inherit', outline: 'none' }}
            />
            {isOpen && filtered.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: bg, border: `1px solid ${border}`, listStyle: 'none', padding: 0, margin: 0, maxHeight: '140px', overflowY: 'auto', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', borderRadius: '4px' }}>
                    {filtered.map((type, idx) => (
                        <li key={type} style={{ padding: '5px 10px', background: idx === highlightedIndex ? (dark ? '#2d2d3f' : '#ede9fe') : 'transparent', color: idx === highlightedIndex ? (dark ? '#a78bfa' : '#7c3aed') : (dark ? '#8b8fa8' : '#64748b'), cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit' }}
                            onMouseDown={() => { setQuery(type); onChange(type); setIsOpen(false); }}
                            onMouseEnter={() => setHighlightedIndex(idx)}>
                            {type}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Sidebar({ tables, updateTable, addTable, removeTable, removeColumn, graphName, setGraphName, saveGraph, loadGraph, deleteGraph, savedGraphs, loadSelection, setLoadSelection, dark, setDark }) {
    const addColumn = (table) => {
        const newCol = { id: `c_${Math.random().toString(36).substring(2, 9)}`, name: 'new_column', type: 'varchar', isNew: true };
        updateTable(table.id, { columns: [...table.columns, newCol] });
    };
    const updateColumn = (table, colId, key, value) => {
        updateTable(table.id, { columns: table.columns.map(col => col.id === colId ? { ...col, [key]: value } : col) });
    };

    const bg = dark ? '#111118' : '#f8fafc';
    const border = dark ? '#1e1e2e' : '#e2e8f0';
    const textPrimary = dark ? '#e2e8f0' : '#1e293b';
    const textMuted = dark ? '#6b7280' : '#94a3b8';
    const inputBg = dark ? '#0d0d14' : '#ffffff';
    const inputBorder = dark ? '#2d2d3f' : '#cbd5e1';
    const btnBg = dark ? '#1e1e2e' : '#e2e8f0';

    return (
        <div style={{ width: '280px', minWidth: '280px', background: bg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'inherit' }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: textPrimary, letterSpacing: '0.05em' }}>SCHEMA</span>
                    <span style={{ fontWeight: '300', fontSize: '0.85rem', color: '#7c3aed', letterSpacing: '0.05em' }}>BUILDER</span>
                </div>
                <button onClick={() => setDark(!dark)} style={{ background: dark ? '#1e1e2e' : '#e2e8f0', border: `1px solid ${inputBorder}`, borderRadius: '20px', width: '44px', height: '22px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: '2px', left: dark ? '24px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: dark ? '#7c3aed' : '#94a3b8', transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                        {dark ? '🌙' : '☀'}
                    </div>
                </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '14px 14px 20px' }}>
                <div style={{ marginBottom: '18px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '600', color: textMuted, letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>Save / Load</p>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <input value={graphName} onChange={(e) => setGraphName(e.target.value)} placeholder="schema name" style={{ flex: 1, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '5px', color: textPrimary, padding: '5px 8px', fontSize: '0.75rem', fontFamily: 'inherit', outline: 'none' }} />
                        <button onClick={saveGraph} style={{ background: '#7c3aed', border: 'none', borderRadius: '5px', color: 'white', padding: '5px 10px', fontSize: '0.72rem', fontFamily: 'inherit', cursor: 'pointer', fontWeight: '600', letterSpacing: '0.03em' }}>Save</button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <select value={loadSelection} onChange={(e) => setLoadSelection(e.target.value)} style={{ flex: 1, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '5px', color: textPrimary, padding: '5px 8px', fontSize: '0.75rem', fontFamily: 'inherit', outline: 'none' }}>
                            <option value="">select schema...</option>
                            {savedGraphs.map(name => (<option key={name} value={name}>{name}</option>))}
                        </select>
                        <button onClick={loadGraph} style={{ background: btnBg, border: `1px solid ${inputBorder}`, borderRadius: '5px', color: textPrimary, padding: '5px 10px', fontSize: '0.72rem', fontFamily: 'inherit', cursor: 'pointer', fontWeight: '500' }}>Load</button>
                        <button onClick={deleteGraph} style={{ background: btnBg, border: `1px solid ${inputBorder}`, borderRadius: '5px', color: '#ef4444', padding: '5px 8px', cursor: 'pointer' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>

                <div style={{ height: '1px', background: border, marginBottom: '14px' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '600', color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Tables</p>
                    <button onClick={addTable} style={{ background: 'transparent', border: `1px dashed ${dark ? '#2d2d3f' : '#cbd5e1'}`, borderRadius: '5px', color: '#7c3aed', padding: '3px 10px', fontSize: '0.7rem', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> table
                    </button>
                </div>

                {tables.map(table => (
                    <SidebarItem key={table.id} table={table} updateTable={updateTable} removeTable={removeTable} updateColumn={updateColumn} addColumn={addColumn} removeColumn={removeColumn} dark={dark} border={border} inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} textMuted={textMuted} />
                ))}
            </div>
        </div>
    );
}

function SidebarItem({ table, updateTable, removeTable, updateColumn, addColumn, removeColumn, dark, border, inputBg, inputBorder, textPrimary, textMuted }) {
    const [collapsed, setCollapsed] = useState(false);
    const [editingName, setEditingName] = useState(table.isNew || false);

    const handleDoubleClick = (e) => { e.stopPropagation(); setEditingName(true); setCollapsed(false); };
    const handleClick = () => { if (!editingName) setCollapsed(!collapsed); };
    const handleKeyDown = (e) => { if (e.key === 'Enter') setEditingName(false); };

    return (
        <div style={{ marginBottom: '8px', border: `1px solid ${border}`, borderRadius: '6px', overflow: 'visible', background: dark ? '#0d0d14' : '#ffffff' }}>
            <div onClick={handleClick} style={{ background: table.color + (dark ? '22' : '33'), borderBottom: collapsed ? 'none' : `1px solid ${border}`, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: collapsed ? '6px' : '6px 6px 0 0' }}>
                <span style={{ color: table.color, fontSize: '0.7rem' }}>{collapsed ? '▶' : '▼'}</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: table.color, flexShrink: 0 }} />
                {editingName ? (
                    <input autoFocus={table.isNew || false} value={table.name} onChange={(e) => updateTable(table.id, { name: e.target.value })} onBlur={() => setEditingName(false)} onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()} onFocus={(e) => e.target.select()}
                           style={{ flex: 1, fontWeight: '600', boxSizing: 'border-box', background: 'rgba(255,255,255,0.1)', border: `1px solid ${table.color}66`, padding: '2px 5px', borderRadius: '3px', color: textPrimary, fontSize: '0.75rem', fontFamily: 'inherit', outline: 'none' }} />
                ) : (
                    <div onDoubleClick={handleDoubleClick} style={{ fontWeight: '600', fontSize: '0.75rem', color: textPrimary, userSelect: 'none', flex: 1 }}>{table.name}</div>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeTable(table.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#ef4444', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
            {!collapsed && (
                <div style={{ padding: '8px 10px' }}>
                    {table.columns.map(col => (
                        <div key={col.id} style={{ display: 'flex', gap: '5px', marginBottom: '4px', alignItems: 'center' }}>
                            <input autoFocus={col.isNew || false} value={col.name} onChange={(e) => updateColumn(table, col.id, 'name', e.target.value)} onFocus={(e) => e.target.select()}
                                   style={{ flex: 1, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '4px', color: textPrimary, padding: '3px 6px', fontSize: '0.72rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                            <DatatypeSearch value={col.type} onChange={(val) => updateColumn(table, col.id, 'type', val)} onEnterWhenClosed={() => addColumn(table)} dark={dark} />
                            <button onClick={() => removeColumn(table.id, col.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => addColumn(table)} style={{ marginTop: '6px', width: '100%', cursor: 'pointer', background: 'transparent', border: `1px dashed ${dark ? '#2d2d3f' : '#cbd5e1'}`, borderRadius: '4px', color: textMuted, padding: '4px', fontSize: '0.68rem', fontFamily: 'inherit' }}>
                        + column
                    </button>
                </div>
            )}
        </div>
    );
}
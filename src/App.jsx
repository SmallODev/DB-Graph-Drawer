import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './assets/Sidebar.jsx';
import Canvas from './assets/Canvas.jsx';

const colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#748ffc', '#da77f2', '#f783ac'];

const initialTables = [
    { id: 'user_table', name: 'user', x: 400, y: 100, color: colors[0], columns: [{ id: 'c1', name: 'id', type: 'bigint' }, { id: 'c2', name: 'username', type: 'varchar' }] }
];

export default function SchemaBuilder() {
    const [tables, setTables] = useState(initialTables);
    const [connections, setConnections] = useState([]);
    const [graphName, setGraphName] = useState('untitled');
    const [savedGraphs, setSavedGraphs] = useState([]);
    const [loadSelection, setLoadSelection] = useState('');
    const [dark, setDark] = useState(true);
    const [importError, setImportError] = useState('');
    const importRef = useRef(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}');
        setSavedGraphs(Object.keys(stored));
    }, []);

    const updateTable = (id, data) => setTables(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));

    const addTable = () => {
        const newTable = { id: `table_${Math.random().toString(36).substring(2, 9)}`, name: 'new_table', x: Math.floor(Math.random() * 200) + 100, y: Math.floor(Math.random() * 200) + 100, color: colors[Math.floor(Math.random() * colors.length)], isNew: true, columns: [{ id: `c_${Math.random().toString(36).substring(2, 9)}`, name: 'id', type: 'bigint' }] };
        setTables(prev => [...prev, newTable]);
    };

    const removeTable = (id) => { setTables(prev => prev.filter(t => t.id !== id)); setConnections(prev => prev.filter(c => c.fromTable !== id && c.toTable !== id)); };
    const removeColumn = (tableId, colId) => { setTables(prev => prev.map(t => t.id === tableId ? { ...t, columns: t.columns.filter(c => c.id !== colId) } : t)); setConnections(prev => prev.filter(c => !((c.fromTable === tableId && c.fromCol === colId) || (c.toTable === tableId && c.toCol === colId)))); };

    const saveGraph = () => { if (!graphName.trim()) return; const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}'); stored[graphName] = { tables, connections }; localStorage.setItem('saved_schemas', JSON.stringify(stored)); setSavedGraphs(Object.keys(stored)); };
    const loadGraph = () => { if (!loadSelection) return; const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}'); if (stored[loadSelection]) { setTables(stored[loadSelection].tables || []); setConnections(stored[loadSelection].connections || []); setGraphName(loadSelection); } };
    const deleteGraph = () => { if (!loadSelection) return; const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}'); delete stored[loadSelection]; localStorage.setItem('saved_schemas', JSON.stringify(stored)); setSavedGraphs(Object.keys(stored)); setLoadSelection(''); if (graphName === loadSelection) { setGraphName('untitled'); setTables(initialTables); setConnections([]); } };

    // Export current schema as a JSON file download
    const exportSchema = () => {
        const payload = { name: graphName, tables, connections };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${graphName || 'schema'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import a JSON file and save it as a new schema (does not overwrite current)
    const importSchema = (e) => {
        setImportError('');
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!Array.isArray(data.tables)) throw new Error('Missing tables array');
                // Remap IDs to avoid collisions with existing data
                const idMap = {};
                const suffix = Math.random().toString(36).substring(2, 7);
                const newTables = (data.tables || []).map(t => {
                    const newId = `${t.id}_${suffix}`;
                    idMap[t.id] = newId;
                    return {
                        ...t,
                        id: newId,
                        columns: (t.columns || []).map(c => {
                            const newColId = `${c.id}_${suffix}`;
                            idMap[c.id] = newColId;
                            return { ...c, id: newColId };
                        }),
                    };
                });
                const newConnections = (data.connections || []).map(c => ({
                    ...c,
                    id: `conn_${Math.random().toString(36).substring(2, 9)}`,
                    fromTable: idMap[c.fromTable] ?? c.fromTable,
                    toTable: idMap[c.toTable] ?? c.toTable,
                    fromCol: idMap[c.fromCol] ?? c.fromCol,
                    toCol: idMap[c.toCol] ?? c.toCol,
                }));

                // Determine a unique name for the import
                const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}');
                let importName = data.name || file.name.replace(/\.json$/, '') || 'imported';
                if (stored[importName]) importName = `${importName}_${suffix}`;

                // Save to localStorage and switch to it
                stored[importName] = { tables: newTables, connections: newConnections };
                localStorage.setItem('saved_schemas', JSON.stringify(stored));
                setSavedGraphs(Object.keys(stored));
                setTables(newTables);
                setConnections(newConnections);
                setGraphName(importName);
                setLoadSelection(importName);
            } catch (err) {
                setImportError('Invalid JSON schema file');
            }
            // Reset input so the same file can be re-imported
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className={dark ? 'dark' : ''} style={{ height: '100vh', display: 'flex', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
            <div className="flex h-screen w-full bg-slate-50 dark:bg-[#09090f] text-slate-800 dark:text-slate-200">
                <Sidebar tables={tables} updateTable={updateTable} addTable={addTable} removeTable={removeTable} removeColumn={removeColumn} graphName={graphName} setGraphName={setGraphName} saveGraph={saveGraph} loadGraph={loadGraph} deleteGraph={deleteGraph} savedGraphs={savedGraphs} loadSelection={loadSelection} setLoadSelection={setLoadSelection} dark={dark} setDark={setDark} exportSchema={exportSchema} importSchema={importSchema} importRef={importRef} importError={importError} />
                <Canvas tables={tables} updateTable={updateTable} removeTable={removeTable} connections={connections} setConnections={setConnections} dark={dark} />
            </div>
        </div>
    );
}
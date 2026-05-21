import React, { useState, useEffect } from 'react';
import Sidebar from './assets/Sidebar';
import Canvas from './assets/Canvas';

const colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#748ffc', '#da77f2', '#f783ac'];

const initialTables = [
    {
        id: 'user_table',
        name: 'user',
        x: 400,
        y: 100,
        color: colors[0],
        columns: [
            { id: 'c1', name: 'id', type: 'bigint' },
            { id: 'c2', name: 'username', type: 'varchar' }
        ]
    }
];

export default function SchemaBuilder() {
    const [tables, setTables] = useState(initialTables);
    const [connections, setConnections] = useState([]);
    const [graphName, setGraphName] = useState('untitled');
    const [savedGraphs, setSavedGraphs] = useState([]);
    const [loadSelection, setLoadSelection] = useState('');
    const [dark, setDark] = useState(true);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}');
        setSavedGraphs(Object.keys(stored));
    }, []);

    const updateTable = (id, newTableData) => {
        setTables(prev => prev.map(t => t.id === id ? { ...t, ...newTableData } : t));
    };

    const addTable = () => {
        const newTable = {
            id: `table_${Math.random().toString(36).substring(2, 9)}`,
            name: 'new_table',
            x: Math.floor(Math.random() * 200) + 100,
            y: Math.floor(Math.random() * 200) + 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            isNew: true,
            columns: [
                { id: `c_${Math.random().toString(36).substring(2, 9)}`, name: 'id', type: 'bigint' }
            ]
        };
        setTables(prev => [...prev, newTable]);
    };

    const removeTable = (id) => {
        setTables(prev => prev.filter(t => t.id !== id));
        setConnections(prev => prev.filter(c => c.fromTable !== id && c.toTable !== id));
    };

    const removeColumn = (tableId, colId) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, columns: t.columns.filter(c => c.id !== colId) } : t));
        setConnections(prev => prev.filter(c => !((c.fromTable === tableId && c.fromCol === colId) || (c.toTable === tableId && c.toCol === colId))));
    };

    const saveGraph = () => {
        if (!graphName.trim()) return;
        const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}');
        stored[graphName] = { tables, connections };
        localStorage.setItem('saved_schemas', JSON.stringify(stored));
        setSavedGraphs(Object.keys(stored));
    };

    const loadGraph = () => {
        if (!loadSelection) return;
        const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}');
        if (stored[loadSelection]) {
            setTables(stored[loadSelection].tables || []);
            setConnections(stored[loadSelection].connections || []);
            setGraphName(loadSelection);
        }
    };

    const deleteGraph = () => {
        if (!loadSelection) return;
        const stored = JSON.parse(localStorage.getItem('saved_schemas') || '{}');
        delete stored[loadSelection];
        localStorage.setItem('saved_schemas', JSON.stringify(stored));
        setSavedGraphs(Object.keys(stored));
        setLoadSelection('');
        if (graphName === loadSelection) {
            setGraphName('untitled');
            setTables(initialTables);
            setConnections([]);
        }
    };

    return (
        <div className={dark ? 'dark' : ''} style={{ height: '100vh', display: 'flex', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
            <div className="flex h-screen w-full bg-[#0d0d0f] text-[#c9d1d9] dark:bg-[#0d0d0f] dark:text-[#c9d1d9]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <Sidebar
                    tables={tables} updateTable={updateTable} addTable={addTable}
                    removeTable={removeTable} removeColumn={removeColumn}
                    graphName={graphName} setGraphName={setGraphName}
                    saveGraph={saveGraph} loadGraph={loadGraph} deleteGraph={deleteGraph}
                    savedGraphs={savedGraphs} loadSelection={loadSelection}
                    setLoadSelection={setLoadSelection} dark={dark} setDark={setDark}
                />
                <Canvas tables={tables} updateTable={updateTable} removeTable={removeTable} connections={connections} setConnections={setConnections} dark={dark} />
            </div>
        </div>
    );
}
# Database Grapher

A visual schema builder that lives in your browser. Design tables, define columns, and draw relationships — no server required. Everything is persisted to local storage automatically as you work.


![Screenshot 2026-05-21 205249.png](Screenshot%202026-05-21%20205249.png)
---

## Setup

Clone the repo and run:

```shell
  npm i
```

```shell
  npm run dev
```

Then open [localhost:5173](http://localhost:5173) in your browser.

---

## How it works

1. **Create a table** — Add a new table and give it a name to start building your schema.
2. **Define columns** — Name your columns and set datatypes using the keyboard shortcuts below.
3. **Draw relations** — Drag the dot handles between tables to connect them with relationship lines.
4. **Auto-saved** — Everything is persisted to local storage automatically as you work.

---

## Keyboard shortcuts

| Input | Action |
|---|---|
| `Tab` | Move from table title → column name → datatype |
| `Enter` | Confirm the datatype for a column |
| `Enter` `Enter` | Add a new column below |
| `Double-click` | Rename a table |
| `Drag handle` | Connect two tables with a relationship line |
| `Drag table` | Reposition any table on the canvas |

---

## Stack

Built with **React** and **Vite**. Data stays in your browser via local storage.
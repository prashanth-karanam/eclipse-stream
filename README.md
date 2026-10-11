# Eclipse Stream (CinePulse)

A self-hosted personal media streaming interface and watchlist manager engineered with vanilla web APIs, responsive media layouts, and a zero-dependency Node.js HTTP server.

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Self--Hosted-blue?style=flat)](https://github.com/prashanth-karanam/eclipse-stream)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js%20HTTP-339933?style=flat&logo=nodedotjs)](https://nodejs.org)
[![Vanilla JS](https://img.shields.io/badge/Frontend-ES6%20%2F%20HTML5%20Video-F7DF1E?style=flat&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](LICENSE)

---

## Overview

**Eclipse Stream** is a lightweight, self-hosted web media player and movie metadata explorer. Built without heavyweight frontend frameworks or complex build toolchains, it delivers an ultra-fast streaming interface with dynamic category browsing, media playback overlays, and custom watchlist tracking.

## Key Features

- **Lightweight Architecture**: Zero-framework vanilla JavaScript client with optimized CSS3 glassmorphism layout.
- **Embedded Media Server**: Built-in zero-dependency Node.js server (`server.js`) handling MIME types, static file serving, and asset routing.
- **Responsive Media Player**: Fluid HTML5 video player integration with custom playback controls and responsive layout across mobile and desktop.
- **Zero Heavy Toolchains**: Runs directly out of the box without bundlers, Webpack, or complicated build configurations.

## Architecture

```
+-------------------------------------------------------------+
|                      Browser Client                         |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |  CinePulse Media UI   | <-> |  HTML5 Video Canvas   |   |
|   |  (Catalog & Watchlist)|     |  (Overlay Controls)   |   |
|   +-----------------------+     +-----------------------+   |
+-------------------------------------------------------------+
                              | (HTTP / Static Assets)
                              v
+-------------------------------------------------------------+
|                Local Node.js HTTP Daemon                    |
|                        (server.js)                          |
+-------------------------------------------------------------+
```

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Video API, CSS3
- **Backend / Daemon**: Node.js (`http`, `fs`, `path`)
- **Port**: Default `3000` (Configurable via `PORT`)

## Getting Started

### Prerequisites
- Node.js installed (v16+)

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prashanth-karanam/eclipse-stream.git
   cd eclipse-stream
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **Open in your browser:**  
   Visit `http://localhost:3000` to access the interface.

## License

This project is open-source and licensed under the [MIT License](LICENSE).

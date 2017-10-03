import React from 'react';
import { renderToString } from 'react-dom/server';
import { extractCritical } from 'emotion-server';

import App from './app';

export default function render() {
    const { html, ids, css } = extractCritical(renderToString(<App/>));
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>MarkBook</title>
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
                <style>${css}</style>
            </head>
            <body>
                <main>${html}</main>
                <script src="bundle.js"></script>
                <script>hydrateEditor(${JSON.stringify(ids)})</script>
            </body>
        </html>
    `;
};

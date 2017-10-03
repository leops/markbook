import React from 'react';
import ReactDOM from 'react-dom';
import { hydrate } from 'emotion';

export default function(ids) {
    hydrate(ids);

    const { default: App } = require('./app');
    ReactDOM.hydrate(
        <App />,
        document.querySelector('main'),
    );
}

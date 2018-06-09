import React from 'react';
import { css, injectGlobal } from 'emotion';
import styled from 'react-emotion';
import Icon from 'react-fontawesome';

import marked from 'marked';
import vkbeautify from 'vkbeautify';
import Viz from 'viz.js';

import Renderer from './renderer';

const svgXmlToPngBase64 = (svgXml, scale) => new Promise((resolve, reject) => {
    Viz.svgXmlToPngBase64(svgXml, scale, (err, res) => {
        if(err) {
            reject(err);
        } else {
            resolve(res);
        }
    });
});

injectGlobal`
    html, body, main, main > div {
        margin: 0;
        height: 100vh;
        width: 100vw;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #333;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    * {
        box-sizing: border-box;
    }

    input[type=file] {
        display: none;
    }
`;

const Menu = styled.div`
    display: flex;
    flex-direction: row;
    background: #4A4A4A;
`;

const Group = styled.div`
    margin: 5px 9px;
    height: 38px;
    display: inline-block;
`;

const button = css`
    width: 38px;
    height: 38px;
    padding: 10px 8px;
    margin: 0;
    background: none;
    border: none;
    color: #ddd;
    border-radius: 4px;
    text-decoration: none;
    display: inline-block;
    text-align: center;

    &:hover {
        color: #fff;
        border-color: rgba(128, 128, 128, 0.1);
        background-color: #313131;
    }
`;

const Button = styled.button`
    ${button};
`;

const Editor = styled.div`
    flex: 1;
    display: flex;
    flex-direction: row;
    min-height: 0;
`;

const Textarea = styled.textarea`
    flex: 1;
    padding: 20px;
    font-family: 'Monaco', courier, monospace;
    border: none;
    border-right: 1px solid #ccc;
    resize: none;
    outline: none;
    background-color: #f6f6f6;
    font-size: 14px;
`;

const Result = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 40%;

    & > * {
        padding: 20px;
        overflow: auto;
    }
`;

const Preview = styled.div`
    border-bottom: 1px solid #ccc;
    flex: 2;
`;

const Code = styled.code`
    flex: 1;
    font-family: 'Monaco', courier, monospace;
    white-space: pre;
    min-height: 0;
`;

const Counter = styled.div`
    margin: 5px 9px;
    display: inline-block;
    color: #ddd;
    align-self: center;
    flex: 1;
    text-align: right;
`;

function extension(filter, transform) {
    const test = new RegExp(`\\{%\\s*${filter}((.|\\r|\\n)+?)%\\}`, 'm');
    return async value => {
        let pos = value.search(test);
        while(pos >= 0) {
            const [substr, content] = value.match(test);
            const res = await transform(content);
            value = value.substr(0, pos) + res + value.substr(pos + substr.length);
            pos = value.search(test);
        }

        return value;
    };
}

const extDot = extension('dot', async content => {
    const result = Viz(content);
    const data = await svgXmlToPngBase64(result, undefined);
    return `![${content}](data:image/png;base64,${data})`;
});
const extYouTube = extension('youtube', url => (
    `<videodata fileref="${url}" />`
));

export default class App extends React.Component {
    state = {
        initialRender: true,
        value: '# hello',
        valueDot: null,
        length: 0,
    }

    componentDidMount() {
        if(typeof localStorage !== 'undefined') {
            this.setState({ value: localStorage['__markbook_save'] });
        }

        this.updateAsync(null);
    }
    
    componentDidUpdate(prevProps, prevState) {
        this.updateAsync(prevState.value);
        
        if(this.preview) {
            const { length } = this.preview.textContent || this.preview.innerText;
            if(this.state.length !== length) {
                this.setState({ length });
            }
        }
    }

    async updateAsync(prevValue) {
        if(prevValue !== this.state.value) {
            const { value } = this.state;
            const valueYT = await extYouTube(value);
            const valueDot = await extDot(valueYT);
            this.setState(state => ({
                initialRender: state.initialRender,
                value: state.value,
                valueDot,
            }));

            localStorage['__markbook_save'] = value;
        }
    }

    onDragOver = evt => {
        evt.preventDefault();
    }

    onDrop = evt => {
        evt.preventDefault();
        const { files, items } = evt.dataTransfer;
        const data = items ?
            Array.from(items).map(item => item.getAsFile()) :
            Array.from(files);

        for(const file of data) {
            if(file.type.split('/')[0] === 'image') {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    this.handleAction(r => {
                        r.insert = `![text](${reader.result})`;
                        r.start += 2;
                        r.end = r.start + 4;
                    })();
                };
            }
        }
    }

    setValue(value) {
        this.setState(state => ({
            valueDot: state.valueDot,
            initialRender: false,
            value,
        }));
    }

    handleRef(name) {
        return ref => {
            this[name] = ref;
        };
    }

    handleAction(action) {
        return () => {
            const start = this.area.selectionStart;
            const end = this.area.selectionEnd;
            const result = {
                insert: '',
                start,
                end,
            };

            action(result);

            this.setState(
                state => ({
                    initialRender: false,
                    value: state.value.slice(0, start) + result.insert + state.value.slice(end),
                    valueDot: state.valueDot,
                }),
                () => {
                    this.area.focus();
                    this.area.setSelectionRange(result.start, result.end);
                },
            );
        };
    }

    onBold(r) {
        r.insert = '**bold**';
        r.start += 2;
        r.end = r.start + 4;
    }
    onItalic(r) {
        r.insert = '*italic*';
        r.start += 1;
        r.end = r.start + 6;
    }

    onLink(r) {
        r.insert = '[text](url)';
        r.start += 7;
        r.end = r.start + 3;
    }
    onQuote(r) {
        r.insert = '> ';
        r.start += 2;
        r.end = r.start;
    }
    onCode(r) {
        r.insert = '```\ncode\n```';
        r.start += 4;
        r.end = r.start + 4;
    }
    onImage(r) {
        r.insert = '![text](url)';
        r.start += 8;
        r.end = r.start + 3;
    }

    onList(r) {
        r.insert = ' - ';
        r.start += 3;
        r.end = r.start;
    }
    onHeading(r) {
        r.insert = '#';
        r.start++;
        r.end = r.start;
    }
    onSeparator(r) {
        for (let i = 0; i <= 10; i++) {
            r.insert += '-';
            r.start++;
        }

        r.end = r.start;
    }
    onGraph(r) {
        r.insert = '{% dot digraph G { a -> b; a -> c; b -> d; c -> d; } %}';
        r.start += 19;
        r.end = r.start + 31;
    }
    onYouTube(r) {
        r.insert = '{% youtube https://www.youtube.com/embed/WiJYhL8hswY %}';
        r.start += 41;
        r.end = r.start + 11;
    }

    onLoadFile(evt) {
        if (evt.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
                this.setValue(reader.result);
            });

            reader.readAsText(evt.target.files[0]);
        }
    }

    render() {
        const { initialRender, value, length } = this.state;
        const valueDot = this.state.valueDot || this.state.value;

        const renderer = new Renderer();
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n${marked(valueDot, {renderer})}`;
        while (renderer.currentLevel >= 0) {
            xml += '</section>';
            renderer.currentLevel--;
        }

        const code = vkbeautify.xml(xml).replace(/^\s+<!\[CDATA\[/mg, '<![CDATA[');
        const html = marked(valueDot).replace(/<videodata fileref="(.+)" \/>/g, '<iframe src="$1"></iframe>');

        let codeFile = '#';
        let valueFile = '#';
        if(!initialRender) {
            valueFile = URL.createObjectURL(
                new File(
                    [value],
                    "file.md",
                    {type: "application/markdown"},
                ),
            );
            codeFile = URL.createObjectURL(
                new File(
                    [code],
                    "file.docbook",
                    {type: "application/docbook+xml"},
                ),
            );
        }

        return (
            <div>
                <Menu>
                    <Group>
                        <Button type="button" title="New" onClick={() => this.setValue('')}>
                            <Icon name="file" />
                        </Button>
                        <Button type="button" title="Open" onClick={() => this.loader.click()}>
                            <Icon name="folder-open" />
                            <input type="file"
                                ref={this.handleRef('loader')}
                                onChange={this.onLoadFile.bind(this)}
                                autoComplete="off" />
                        </Button>
                        <a className={button} href={valueFile} title="Save">
                            <Icon name="save" />
                        </a>
                        <a className={button} href={codeFile} title="Export">
                            <Icon name="upload" />
                        </a>
                    </Group>
                    <Group>
                        <Button type="button" title="Bold" onClick={this.handleAction(this.onBold)}>
                            <Icon name="bold" />
                        </Button>
                        <Button type="button" title="Italic" onClick={this.handleAction(this.onItalic)}>
                            <Icon name="italic" />
                        </Button>
                    </Group>
                    <Group>
                        <Button type="button" title="Link" onClick={this.handleAction(this.onLink)}>
                            <Icon name="link" />
                        </Button>
                        <Button type="button" title="Quote" onClick={this.handleAction(this.onQuote)}>
                            <Icon name="quote-left" />
                        </Button>
                        <Button type="button" title="Code" onClick={this.handleAction(this.onCode)}>
                            <Icon name="code" />
                        </Button>
                        <Button type="button" title="Image" onClick={this.handleAction(this.onImage)}>
                            <Icon name="picture-o" />
                        </Button>
                    </Group>
                    <Group>
                        <Button type="button" title="List" onClick={this.handleAction(this.onList)}>
                            <Icon name="list-ul" />
                        </Button>
                        <Button type="button" title="Heading" onClick={this.handleAction(this.onHeading)}>
                            <Icon name="header" />
                        </Button>
                        <Button type="button" title="Separator" onClick={this.handleAction(this.onSeparator)}>
                            <Icon name="ellipsis-h" />
                        </Button>
                        <Button type="button" title="Graph" onClick={this.handleAction(this.onGraph)}>
                            <Icon name="bar-chart" />
                        </Button>
                        <Button type="button" title="YouTube" onClick={this.handleAction(this.onYouTube)}>
                            <Icon name="youtube-play" />
                        </Button>
                    </Group>
                    <Counter>~{length} signs</Counter>
                </Menu>
                <Editor>
                    <Textarea
                        value={value}
                        onChange={evt => this.setValue(evt.target.value)}
                        onDragOver={this.onDragOver}
                        onDrop={this.onDrop}
                        innerRef={this.handleRef('area')} />
                    <Result>
                        <Preview innerRef={elem => this.preview = elem} dangerouslySetInnerHTML={{ __html: html }} />
                        <Code>{code}</Code>
                    </Result>
                </Editor>
            </div>
        );
    }
}

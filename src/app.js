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

const TEST_DOT = /\{%\s*dot((.|\r|\n)+?)%\}/m;

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initialRender: true,
            value: '# hello',
            valueDot: null,
        };

        this.onDragOver = evt => {
            evt.preventDefault();
        };
        this.onDrop = evt => {
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
        };
    }

    async componentDidUpdate(prevProps, prevState) {
        if(prevState.value !== this.state.value) {
            let { value } = this.state;

            let pos = value.search(TEST_DOT);
            while(pos >= 0) {
                const [substr, content] = value.match(TEST_DOT);

                const result = Viz(content);
                const data = await svgXmlToPngBase64(result, undefined);

                value = `${value.substr(0, pos)}![${content}](data:image/png;base64,${data})${value.substr(pos + substr.length)}`;
                pos = value.search(TEST_DOT);
            }

            this.setState(state => ({
                initialRender: state.initialRender,
                value: state.value,
                valueDot: value,
            }));
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
        const { initialRender, value } = this.state;
        const valueDot = this.state.valueDot || this.state.value;

        const renderer = new Renderer();
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n${marked(valueDot, {renderer})}`;
        while (renderer.currentLevel >= 0) {
            xml += '</section>';
            renderer.currentLevel--;
        }

        const code = vkbeautify.xml(xml).replace(/^\s+<!\[CDATA\[/mg, '<![CDATA[');

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
                                onChange={this.onLoadFile.bind(this)} />
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
                    </Group>
                </Menu>
                <Editor>
                    <Textarea
                        value={value}
                        onChange={evt => this.setValue(evt.target.value)}
                        onDragOver={this.onDragOver}
                        onDrop={this.onDrop}
                        innerRef={this.handleRef('area')} />
                    <Result>
                        <Preview dangerouslySetInnerHTML={{ __html: marked(valueDot) }} />
                        <Code>{code}</Code>
                    </Result>
                </Editor>
            </div>
        );
    }
}

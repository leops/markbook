import { Renderer } from 'marked';

export default class DocbookRenderer extends Renderer {
    currentLevel = -1
    heading(text, level) {
        let targetLevel = level;
        if(this.currentLevel === -1 && level === 1) {
            targetLevel = 0;
        }

        let section = '';
        if (this.currentLevel < targetLevel) {
            while (this.currentLevel < targetLevel - 1) {
                section += '<section>';
                this.currentLevel++;
            }
        } else if (this.currentLevel > targetLevel) {
            while (this.currentLevel >= targetLevel) {
                section += '</section>';
                this.currentLevel--;
            }
        } else {
            section += '</section>';
            this.currentLevel--;
        }

        this.currentLevel++;
        return section + `<section><title>${text}</title>`;
    }

    code = (code, language) => `<programlisting language="${language}"><![CDATA[${code}]]></programlisting>`
    blockquote = quote => `<quote>${quote}</quote>`
    html = html => html
    hr = () => '</section><section>'
    list = (body, ordered) => `<itemizedlist>${body}</itemizedlist>`
    listitem = text => `<listitem>${text}</listitem>`
    paragraph = text => `<para>${text}</para>`
    table = (header, body) => `<table><thead>${header}</thead><tbody>${body}</tbody></table>`
    tablerow = content => `<row>${content}</row>`
    tablecell = (content, flags) => `<entry>${content}</entry>`
    strong = text => `<emphasis role="strong">${text}</emphasis>`
    em = text => `<emphasis>${text}</emphasis>`
    codespan = code => `<code>${code}</code>`
    br = () => '</para><para>'
    del = text => `<emphasis role="del">${text}</emphasis>`
    link = (href, title, text) => `<ulink url="${href}">${text}</ulink>`
    image = (href, title, text) => `<imagedata fileref="${href}"/>`
}

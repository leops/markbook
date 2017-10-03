import { Renderer } from 'marked';

export default class DocbookRenderer extends Renderer {
    currentLevel = 0
    heading(text, level) {
        let section = '';
        if (level > this.currentLevel) {
            while (this.currentLevel < level) {
                section += '<section>';
                this.currentLevel++;
            }
        } else if (level < this.currentLevel) {
            while (this.currentLevel > level) {
                section += '</section>';
                this.currentLevel--;
            }
        } else {
            section += '</section><section>';
        }

        return section + `<title>${text}</title>`;
    }

    code = (code, language) => `<programlisting language="${language}"><![CDATA[${code}]]></programlisting>`
    blockquote = quote => `<quote>${quote}</quote>`
    html = html => this.code(html, 'html')
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

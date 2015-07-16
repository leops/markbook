currentLevel = 0
renderer =
    code: (code, language) ->
        return "<programlisting language=\"#{language}\"><![CDATA[#{code}]]></programlisting>"
    blockquote: (quote) ->
        return "<quote>#{quote}</quote>"
    html: (html) ->
        return @code html, 'html'
    heading: (text, level) ->
        section = ''
        if level > currentLevel
            while currentLevel < level
                section += '<section>'
                currentLevel++
        else if level < currentLevel
            while currentLevel > level
                section += '</section>'
                currentLevel--
        else
            section += '</section><section>'

        return section + "<title>#{text}</title>"
    hr: ->
        return '</section><section>'
    list: (body, ordered) ->
        return "<itemizedlist>#{body}</itemizedlist>"
    listitem: (text) ->
        return "<listitem>#{text}</listitem>"
    paragraph: (text) ->
        return "<para>#{text}</para>"
    table: (header, body) ->
        return "<table><thead>#{header}</thead><tbody>#{body}</tbody></table>"
    tablerow: (content) ->
        return "<row>#{content}</row>"
    tablecell: (content, flags) ->
        return "<entry>#{content}</entry>"

    strong: (text) ->
        return "<emphasis role=\"strong\">#{text}</emphasis>"
    em: (text) ->
        return "<emphasis>#{text}</emphasis>"
    codespan: (code) ->
        return "<code>#{code}</code>"
    br: ->
        return '</para><para>'
    del: (text) ->
        return "<emphasis role=\"del\">#{text}</emphasis>"
    link: (href, title, text) ->
        return "<ulink url=\"#{href}\">#{text}</ulink>"
    image: (href, title, text) ->
        return "<imagedata fileref=\"#{href}\"/>"

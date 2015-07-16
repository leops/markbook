code = document.querySelector('code')
preview = document.querySelector('.preview')
area = document.querySelector('textarea')
loader = document.getElementById('loader')

render = ->
    preview.innerHTML = marked @value
    window.currentLevel = 0
    xml = '<section>' + marked @value, renderer: renderer
    while window.currentLevel >= 0
        xml += '</section>'
        window.currentLevel--

    code.innerText = code.textContent = vkbeautify.xml xml

area.addEventListener 'input', render
render.call area

Array::slice.apply(document.querySelectorAll('#menu button')).forEach (btn) ->
    btn.addEventListener 'click', (evt) ->
        insert = ''
        start = area.selectionStart
        end = area.selectionEnd

        switch btn.id
            when 'bold'
                insert = '**bold**'
                start += 2
                end = start + 4
            when 'italic'
                insert = '*italic*'
                start += 1
                end = start + 6

            when 'link'
                insert = '[text](url)'
                start += 7
                end = start + 3
            when 'quote'
                insert = '> '
                start += 2
                end = start
            when 'code'
                insert = '```\ncode\n```'
                start += 4
                end = start + 4
            when 'img'
                insert = '![text](url)'
                start += 8
                end = start + 3

            when 'list'
                insert = ' - '
                start += 3
                end = start
            when 'title'
                insert = '#'
                start++
                end = start
            when 'sep'
                for i in [0..10]
                    insert += '-'
                    start++

                end = start

        area.value = area.value.slice(0, area.selectionStart) + insert + area.value.slice(area.selectionEnd)
        area.focus()
        area.setSelectionRange start, end
        render.call area

Array::slice.apply(document.querySelectorAll('#menu a')).forEach (link) ->
    link.addEventListener 'click', (evt) ->
        switch link.id
            when 'new'
                evt.preventDefault()
                area.value = ''
                render.call area
            when 'open'
                loader.click()
            when 'save'
                link.href = URL.createObjectURL(new File([area.value], "file.md", {type: "application/markdown"}))
            when 'export'
                link.href = URL.createObjectURL(new File([code.innerText], "file.docbook", {type: "application/docbook+xml"}))

loader.addEventListener 'change', (evt) ->
    if @files.length > 0
        reader = new FileReader()
        reader.addEventListener 'loadend', ->
            area.value = reader.result
            render.call area

        reader.readAsText @files[0]

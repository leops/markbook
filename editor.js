// Generated by CoffeeScript 1.9.3
var area, code, loader, preview, render;

code = document.querySelector('code');

preview = document.querySelector('.preview');

area = document.querySelector('textarea');

loader = document.getElementById('loader');

render = function() {
  var xml;
  preview.innerHTML = marked(this.value);
  window.currentLevel = 0;
  xml = '<section>' + marked(this.value, {
    renderer: renderer
  });
  while (window.currentLevel >= 0) {
    xml += '</section>';
    window.currentLevel--;
  }
  return code.innerText = code.textContent = vkbeautify.xml(xml);
};

area.addEventListener('input', render);

render.call(area);

Array.prototype.slice.apply(document.querySelectorAll('#menu button')).forEach(function(btn) {
  return btn.addEventListener('click', function(evt) {
    var end, i, insert, j, start;
    insert = '';
    start = area.selectionStart;
    end = area.selectionEnd;
    switch (btn.id) {
      case 'bold':
        insert = '**bold**';
        start += 2;
        end = start + 4;
        break;
      case 'italic':
        insert = '*italic*';
        start += 1;
        end = start + 6;
        break;
      case 'link':
        insert = '[text](url)';
        start += 7;
        end = start + 3;
        break;
      case 'quote':
        insert = '> ';
        start += 2;
        end = start;
        break;
      case 'code':
        insert = '```\ncode\n```';
        start += 4;
        end = start + 4;
        break;
      case 'img':
        insert = '![text](url)';
        start += 8;
        end = start + 3;
        break;
      case 'list':
        insert = ' - ';
        start += 3;
        end = start;
        break;
      case 'title':
        insert = '#';
        start++;
        end = start;
        break;
      case 'sep':
        for (i = j = 0; j <= 10; i = ++j) {
          insert += '-';
          start++;
        }
        end = start;
    }
    area.value = area.value.slice(0, area.selectionStart) + insert + area.value.slice(area.selectionEnd);
    area.focus();
    area.setSelectionRange(start, end);
    return render.call(area);
  });
});

Array.prototype.slice.apply(document.querySelectorAll('#menu a')).forEach(function(link) {
  return link.addEventListener('click', function(evt) {
    switch (link.id) {
      case 'new':
        evt.preventDefault();
        area.value = '';
        return render.call(area);
      case 'open':
        return loader.click();
      case 'save':
        return link.href = URL.createObjectURL(new File([area.value], "file.md", {
          type: "application/markdown"
        }));
      case 'export':
        return link.href = URL.createObjectURL(new File([code.innerText], "file.docbook", {
          type: "application/docbook+xml"
        }));
    }
  });
});

loader.addEventListener('change', function(evt) {
  var reader;
  if (this.files.length > 0) {
    reader = new FileReader();
    reader.addEventListener('loadend', function() {
      area.value = reader.result;
      return render.call(area);
    });
    return reader.readAsText(this.files[0]);
  }
});
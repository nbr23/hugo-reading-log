function getFlagEmoji(countryCode) {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .split('')
    .map(function(char) { return String.fromCodePoint(127397 + char.charCodeAt(0)); })
    .join('');
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('h2').forEach(function(h2) {
    var ul = h2.nextElementSibling;
    if (ul && ul.tagName === 'UL') {
      var count = ul.querySelectorAll('li').length;
      h2.addEventListener('mouseenter', function() {
        if (!h2.querySelector('.book-count')) {
          var span = document.createElement('span');
          span.className = 'book-count';
          span.textContent = '(' + count + ' book' + (count !== 1 ? 's' : '') + ')';
          h2.appendChild(span);
        }
      });
      h2.addEventListener('mouseleave', function() {
        var span = h2.querySelector('.book-count');
        if (span) span.remove();
      });
    }
  });

  document.querySelectorAll('.author').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var author = this.getAttribute('data-author');
      var isHighlighted = this.classList.contains('highlighted');

      document.querySelectorAll('.author.highlighted').forEach(function(a) {
        a.classList.remove('highlighted');
        var countSpan = a.querySelector('.author-count');
        if (countSpan) countSpan.remove();
        var flagSpan = a.querySelector('.author-flag');
        if (flagSpan) flagSpan.remove();
      });

      if (!isHighlighted) {
        var matches = document.querySelectorAll('.author[data-author="' + author + '"]');
        var count = matches.length;
        var authorName = this.textContent;
        var country = authorCountries[authorName];
        matches.forEach(function(a) {
          a.classList.add('highlighted');
          if (count > 1) {
            var countSpan = document.createElement('span');
            countSpan.className = 'author-count';
            countSpan.textContent = ' (' + count + ' books)';
            a.appendChild(countSpan);
          }
          if (country) {
            var code = countryToCode[country];
            if (code) {
              var flagSpan = document.createElement('span');
              flagSpan.className = 'author-flag';
              flagSpan.textContent = getFlagEmoji(code);
              flagSpan.title = country;
              a.appendChild(flagSpan);
            } else {
              var countrySpan = document.createElement('span');
              countrySpan.className = 'author-count';
              countrySpan.textContent = ' (' + country + ')';
              a.appendChild(countrySpan);
            }
          }
        });
      }
    });
  });

  document.addEventListener('click', function() {
    document.querySelectorAll('.author.highlighted').forEach(function(a) {
      a.classList.remove('highlighted');
      var countSpan = a.querySelector('.author-count');
      if (countSpan) countSpan.remove();
      var flagSpan = a.querySelector('.author-flag');
      if (flagSpan) flagSpan.remove();
    });
  });

  var mapPanel = document.getElementById('map-panel');
  var mapToggleBtn = document.getElementById('map-toggle-btn');
  var mapCloseBtn = document.getElementById('map-close-btn');

  if (mapToggleBtn) {
    mapToggleBtn.addEventListener('click', function() {
      mapPanel.classList.add('visible');
    });
  }

  if (mapCloseBtn) {
    mapCloseBtn.addEventListener('click', function() {
      mapPanel.classList.remove('visible');
    });
  }
});

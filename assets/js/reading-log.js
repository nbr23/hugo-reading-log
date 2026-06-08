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
      h2.addEventListener('click', function(e) {
        e.stopPropagation();
        if (activeYear === h2) {
          clearFilter();
        } else {
          filterByYear(h2);
        }
      });
    }
  });

  var activeAuthor = null;
  var activeCountry = null;
  var activeYear = null;
  var mapIframe = document.querySelector('#map-panel iframe');

  function sendToMap(msg) {
    if (mapIframe && mapIframe.contentWindow) {
      mapIframe.contentWindow.postMessage(msg, '*');
    }
  }

  function clearFilter(fromMessage) {
    activeAuthor = null;
    activeCountry = null;
    activeYear = null;
    document.querySelectorAll('.author.highlighted').forEach(function(a) {
      a.classList.remove('highlighted');
      a.querySelectorAll('.author-count').forEach(function(s) { s.remove(); });
      a.querySelectorAll('.author-flag').forEach(function(s) { s.remove(); });
    });
    document.querySelectorAll('.book-list > ul > li').forEach(function(li) {
      li.classList.remove('filtered-out');
    });
    document.querySelectorAll('.book-list > ul').forEach(function(ul) {
      ul.classList.remove('filtered-out');
    });
    document.querySelectorAll('.book-list h2').forEach(function(h2) {
      h2.classList.remove('filtered-out', 'year-active');
    });
    if (!fromMessage) {
      sendToMap({ type: 'clear' });
    }
  }

  function filterByYear(h2) {
    clearFilter(true);
    activeYear = h2;

    var ul = h2.nextElementSibling;
    if (!ul || ul.tagName !== 'UL') return;

    document.querySelectorAll('.book-list h2').forEach(function(other) {
      if (other === h2) return;
      other.classList.add('filtered-out');
      var otherUl = other.nextElementSibling;
      if (otherUl && otherUl.tagName === 'UL') {
        otherUl.classList.add('filtered-out');
      }
    });

    h2.classList.add('year-active');

    var authors = Array.prototype.map.call(ul.querySelectorAll('.author'), function(el) {
      return el.textContent;
    });

    sendToMap({ type: 'filterAuthors', authors: authors });
  }

  function hideNonMatchingBooks(authorKeys) {
    document.querySelectorAll('.book-list > ul > li').forEach(function(li) {
      var found = false;
      for (var i = 0; i < authorKeys.length; i++) {
        if (li.querySelector('.author[data-author="' + authorKeys[i] + '"]')) {
          found = true;
          break;
        }
      }
      if (!found) {
        li.classList.add('filtered-out');
      }
    });
    document.querySelectorAll('.book-list h2').forEach(function(h2) {
      var ul = h2.nextElementSibling;
      if (ul && ul.tagName === 'UL') {
        if (ul.querySelectorAll('li:not(.filtered-out)').length === 0) {
          h2.classList.add('filtered-out');
        }
      }
    });
  }

  function decorateAuthors(matches, authorName) {
    var count = matches.length;
    var countries = authorCountries[authorName] || [];
    matches.forEach(function(a) {
      a.classList.add('highlighted');
      if (count > 1) {
        var countSpan = document.createElement('span');
        countSpan.className = 'author-count';
        countSpan.textContent = ' (' + count + ' books)';
        a.appendChild(countSpan);
      }
      countries.forEach(function(country) {
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
      });
    });
  }

  function filterByAuthor(authorName, fromMessage) {
    var author = authorName.toLowerCase();
    clearFilter(true);
    activeAuthor = author;

    var matches = document.querySelectorAll('.author[data-author="' + author + '"]');
    decorateAuthors(matches, authorName);
    hideNonMatchingBooks([author]);

    if (!fromMessage) {
      sendToMap({ type: 'filterAuthor', author: authorName });
    }
  }

  function filterByCountry(country, fromMessage) {
    clearFilter(true);
    activeCountry = country;

    var matchingKeys = [];
    for (var name in authorCountries) {
      var list = authorCountries[name] || [];
      if (list.indexOf(country) !== -1) {
        matchingKeys.push(name.toLowerCase());
      }
    }

    matchingKeys.forEach(function(key) {
      document.querySelectorAll('.author[data-author="' + key + '"]').forEach(function(a) {
        a.classList.add('highlighted');
      });
    });

    hideNonMatchingBooks(matchingKeys);

    if (!fromMessage) {
      sendToMap({ type: 'filterCountry', country: country });
    }
  }

  document.querySelectorAll('.author').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var author = this.getAttribute('data-author');
      if (activeAuthor === author) {
        clearFilter();
        return;
      }
      filterByAuthor(this.textContent, false);
    });
  });

  document.addEventListener('click', function() {
    if (activeAuthor || activeCountry || activeYear) {
      clearFilter();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && (activeAuthor || activeCountry || activeYear)) {
      clearFilter();
    }
  });

  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data || !data.type) return;
    if (data.type === 'filterCountry' && data.country) {
      filterByCountry(data.country, true);
    } else if (data.type === 'filterAuthor' && data.author) {
      filterByAuthor(data.author, true);
    } else if (data.type === 'clear') {
      clearFilter(true);
    }
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

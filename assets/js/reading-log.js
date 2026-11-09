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
      var yearToggle = h2.querySelector('.year-toggle') || h2;
      yearToggle.addEventListener('click', function(e) {
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
  var activeAuthorName = null;
  var activeCountry = null;
  var activeYear = null;
  var mapIframe = document.querySelector('#map-panel iframe');
  var statsScope = document.getElementById('stats-scope');

  function setStatsScope(scope) {
    if (!statsScope) return;
    statsScope.value = scope;
    if (!statsScope.value) statsScope.value = 'all';
    scope = statsScope.value;
    hideTooltip();
    document.querySelectorAll('[data-stats-scope]').forEach(function(el) {
      el.hidden = el.getAttribute('data-stats-scope') !== scope;
    });
    document.querySelectorAll('#panel-stats [data-year-id]').forEach(function(el) {
      el.setAttribute('aria-pressed', String(el.getAttribute('data-year-id') === scope));
    });
  }

  function statsYear() {
    return statsScope && statsScope.value !== 'all' ? document.getElementById(statsScope.value) : null;
  }

  function updateFilterState() {
    var parts = [];
    if (activeAuthor) parts.push('Author: ' + activeAuthorName.replace(/'/g, '\u2019'));
    if (activeCountry) parts.push('Country: ' + activeCountry);
    if (activeYear) parts.push('Year: ' + activeYear.querySelector('.year-toggle').textContent);
    var filtered = parts.length > 0;
    if (filtered) {
      var count = document.querySelectorAll('.book-list > ul:not(.filtered-out) > li:not(.filtered-out)').length;
      parts.push(count + ' book' + (count !== 1 ? 's' : ''));
    }
    document.querySelectorAll('[data-filter-status]').forEach(function(el) {
      el.hidden = !filtered;
      el.querySelector('[data-filter-summary]').textContent = parts.join(' · ');
    });
    document.querySelectorAll('#panel-stats [data-author]').forEach(function(el) {
      var year = el.getAttribute('data-author-year');
      var selected = activeAuthor === el.getAttribute('data-author') && (!year || (activeYear && activeYear.id === year));
      el.setAttribute('aria-pressed', String(Boolean(selected)));
    });
    document.querySelectorAll('#panel-stats [data-country]').forEach(function(el) {
      var year = el.getAttribute('data-country-year');
      var selected = activeCountry === el.getAttribute('data-country') && (!year || (activeYear && activeYear.id === year));
      el.setAttribute('aria-pressed', String(Boolean(selected)));
    });
  }

  function sendToMap(msg) {
    if (mapIframe && mapIframe.contentWindow) {
      mapIframe.contentWindow.postMessage(msg, '*');
    }
  }

  function resetFilter() {
    activeAuthor = null;
    activeAuthorName = null;
    activeCountry = null;
    activeYear = null;
    document.querySelectorAll('.author.highlighted').forEach(function(a) {
      a.classList.remove('highlighted');
      a.setAttribute('aria-pressed', 'false');
      a.querySelectorAll('.author-count').forEach(function(s) { s.remove(); });
      a.querySelectorAll('.author-flag').forEach(function(s) { s.remove(); });
    });
    document.querySelectorAll('.year-toggle[aria-pressed="true"]').forEach(function(b) {
      b.setAttribute('aria-pressed', 'false');
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
  }

  function clearFilter(fromMessage) {
    resetFilter();
    setStatsScope('all');
    updateFilterState();
    if (!fromMessage) {
      sendToMap({ type: 'clear' });
    }
  }

  function filterByYear(h2) {
    resetFilter();
    var ul = h2.nextElementSibling;
    if (!ul || ul.tagName !== 'UL') return;

    applyYearFilter(h2);
    updateFilterState();

    var authors = Array.prototype.map.call(ul.querySelectorAll('.author'), function(el) {
      return el.textContent;
    });

    sendToMap({ type: 'filterAuthors', authors: authors });
  }

  function applyYearFilter(h2) {
    activeYear = h2;
    setStatsScope(h2.id);
    document.querySelectorAll('.book-list h2').forEach(function(other) {
      if (other === h2) return;
      other.classList.add('filtered-out');
      var otherUl = other.nextElementSibling;
      if (otherUl && otherUl.tagName === 'UL') {
        otherUl.classList.add('filtered-out');
      }
    });

    h2.classList.add('year-active');
    var yearToggle = h2.querySelector('.year-toggle');
    if (yearToggle) yearToggle.setAttribute('aria-pressed', 'true');
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
      a.setAttribute('aria-pressed', 'true');
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
          flagSpan.setAttribute('role', 'img');
          flagSpan.setAttribute('aria-label', country);
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

  function filterByAuthor(authorName, fromMessage, year) {
    var author = authorName.toLowerCase();
    resetFilter();
    activeAuthor = author;
    activeAuthorName = authorName;

    var root = year ? year.nextElementSibling : document;
    var matches = root.querySelectorAll('.author[data-author="' + author + '"]');
    decorateAuthors(matches, authorName);
    hideNonMatchingBooks([author]);
    if (year) {
      applyYearFilter(year);
    } else {
      setStatsScope('all');
    }
    updateFilterState();

    if (!fromMessage) {
      sendToMap({ type: 'filterAuthor', author: authorName });
    }
  }

  function filterByCountry(country, fromMessage, year) {
    resetFilter();
    activeCountry = country;

    var matchingKeys = [];
    for (var name in authorCountries) {
      var list = authorCountries[name] || [];
      if (list.indexOf(country) !== -1) {
        matchingKeys.push(name.toLowerCase());
      }
    }

    var root = year ? year.nextElementSibling : document;
    matchingKeys.forEach(function(key) {
      root.querySelectorAll('.author[data-author="' + key + '"]').forEach(function(a) {
        a.classList.add('highlighted');
        a.setAttribute('aria-pressed', 'true');
      });
    });

    hideNonMatchingBooks(matchingKeys);
    if (year) {
      applyYearFilter(year);
    } else {
      setStatsScope('all');
    }
    updateFilterState();

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

  document.querySelectorAll('[data-clear-filter]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var target = this.closest('#panel-stats') ? statsScope : document.querySelector('.year-toggle');
      clearFilter();
      if (target) target.focus();
    });
  });

  if (statsScope) {
    statsScope.parentElement.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    statsScope.addEventListener('change', function() {
      var year = statsYear();
      if (year) {
        filterByYear(year);
      } else {
        clearFilter();
      }
    });
  }

  document.querySelectorAll('#panel-stats [data-author]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var yearId = this.getAttribute('data-author-year');
      var year = yearId ? document.getElementById(yearId) : statsYear();
      if (activeAuthor === this.getAttribute('data-author') && activeYear === year) {
        clearFilter();
        return;
      }
      filterByAuthor(this.getAttribute('data-name'), false, year);
    });
  });

  document.querySelectorAll('#panel-stats [data-year-id]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var h2 = document.getElementById(this.getAttribute('data-year-id'));
      if (!h2) return;
      if (activeYear === h2) {
        clearFilter();
      } else {
        filterByYear(h2);
      }
    });
  });

  document.querySelectorAll('#panel-stats [data-country]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var country = this.getAttribute('data-country');
      var yearId = this.getAttribute('data-country-year');
      var year = yearId ? document.getElementById(yearId) : statsYear();
      if (activeCountry === country && activeYear === year) {
        clearFilter();
      } else {
        filterByCountry(country, false, year);
      }
      var mapTab = document.getElementById('tab-map');
      if (mapTab && this.hasAttribute('data-show-map')) {
        selectTab(mapTab);
        mapTab.focus();
      }
    });
  });

  var tooltip = document.getElementById('stat-tooltip');
  var tooltipTarget = null;
  var tooltipPinned = false;

  function setHeatAxes(el, on) {
    var cell = el.closest('td');
    if (!cell) return;
    var table = cell.closest('table');
    [cell.parentElement.cells[0], table.tHead.rows[0].cells[cell.cellIndex]].forEach(function(th) {
      if (th) th.classList.toggle('is-hover', on);
    });
  }

  function showTooltip(el) {
    if (tooltipTarget && tooltipTarget !== el) {
      setHeatAxes(tooltipTarget, false);
      tooltipTarget.removeAttribute('aria-describedby');
    }
    tooltipTarget = el;
    el.setAttribute('aria-describedby', tooltip.id);
    tooltip.textContent = '';
    var value = document.createElement('strong');
    value.textContent = el.getAttribute('data-tip-value');
    var label = document.createElement('div');
    label.className = 'stat-tooltip-label';
    label.textContent = el.getAttribute('data-tip-label');
    tooltip.appendChild(value);
    tooltip.appendChild(label);
    JSON.parse(el.getAttribute('data-tip-detail') || '[]').forEach(function(line) {
      var row = document.createElement('div');
      row.className = 'stat-tooltip-detail';
      row.textContent = line;
      tooltip.appendChild(row);
    });
    tooltip.hidden = false;
    setHeatAxes(el, true);

    var rect = el.getBoundingClientRect();
    var tipRect = tooltip.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    var top = rect.top - tipRect.height - 8;
    if (top < 8) top = rect.bottom + 8;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function hideTooltip() {
    if (!tooltip || tooltip.hidden) return;
    tooltip.hidden = true;
    tooltipPinned = false;
    if (tooltipTarget) {
      setHeatAxes(tooltipTarget, false);
      tooltipTarget.removeAttribute('aria-describedby');
    }
    tooltipTarget = null;
  }

  document.querySelectorAll('#panel-stats [data-tip-value]').forEach(function(el) {
    el.addEventListener('pointerenter', function(e) {
      if (e.pointerType === 'mouse' && !tooltipPinned) showTooltip(el);
    });
    el.addEventListener('pointerleave', function(e) {
      if (e.pointerType === 'mouse' && !tooltipPinned) hideTooltip();
    });
    el.addEventListener('focus', function() {
      tooltipPinned = false;
      showTooltip(el);
    });
    el.addEventListener('blur', function() {
      hideTooltip();
    });
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      if (el.closest('[hidden]')) return;
      if (tooltipPinned && tooltipTarget === el) {
        hideTooltip();
        return;
      }
      showTooltip(el);
      tooltipPinned = true;
    });
  });

  if (tooltip) {
    document.addEventListener('click', hideTooltip);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hideTooltip();
    });
    document.getElementById('panel-stats').addEventListener('scroll', hideTooltip);
    window.addEventListener('resize', hideTooltip);
  }

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.panel-tab'));

  function selectTab(tab) {
    hideTooltip();
    tabs.forEach(function(t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
  }

  tabs.forEach(function(tab, i) {
    tab.addEventListener('click', function(e) {
      e.stopPropagation();
      selectTab(tab);
    });
    tab.addEventListener('keydown', function(e) {
      var step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      var next = tabs[(i + step + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
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

  updateFilterState();
});

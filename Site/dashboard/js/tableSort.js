/**
 * Sortable, filterable tables.  Replaces the dashboard's only DataTables usage.
 *
 * Upgrades every <table class="sortable"> that has a <thead> and a <tbody>:
 *   - clicking (or Enter/Space on) a <th> sorts by that column, toggling
 *     ascending / descending
 *   - a filter box is inserted above the table and hides non-matching rows
 *   - rowLight / rowMedium striping is recomputed across the *visible* rows,
 *     which is the job DataTables' stripeClasses option used to do
 *
 * Optional attributes on the table:
 *   data-sort-col="1"     column index to sort by on load
 *   data-sort-dir="desc"  direction for that initial sort, default "asc"
 */
(function () {
  'use strict';

  var STRIPES = ['rowLight', 'rowMedium'];

  function cellText(row, index) {
    var cell = row.cells[index];
    return cell ? cell.textContent.trim() : '';
  }

  /**
   * Compare numerically when both sides are numbers, chronologically when both
   * parse as dates, and as text otherwise.  The date branch is the reason this
   * is not a plain string compare: the timestamps rendered here are not
   * guaranteed to be ISO-ordered, so comparing them as text can order them
   * wrongly.
   */
  function compare(a, b) {
    if (a === b) {
      return 0;
    }

    var numA = Number(a);
    var numB = Number(b);
    if (a !== '' && b !== '' && !isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    var dateA = Date.parse(a);
    var dateB = Date.parse(b);
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateA - dateB;
    }

    return a.localeCompare(b);
  }

  /** Reassign the alternating row classes over whatever is currently visible. */
  function restripe(rows) {
    var visible = 0;

    rows.forEach(function (row) {
      STRIPES.forEach(function (name) {
        row.classList.remove(name);
      });

      if (!row.hidden) {
        row.classList.add(STRIPES[visible % STRIPES.length]);
        visible++;
      }
    });
  }

  function sortRows(table, rows, index, dir) {
    var factor = dir === 'desc' ? -1 : 1;

    var decorated = rows.map(function (row, position) {
      return {row: row, key: cellText(row, index), position: position};
    });

    decorated.sort(function (x, y) {
      // empty cells sort last whichever direction we are going
      if (x.key === '' !== (y.key === '')) {
        return x.key === '' ? 1 : -1;
      }

      var result = compare(x.key, y.key) * factor;

      // fall back to the original order so equal keys never shuffle
      return result !== 0 ? result : x.position - y.position;
    });

    var body = table.tBodies[0];
    decorated.forEach(function (item) {
      body.appendChild(item.row);
    });
  }

  function addFilter(table, rows, onChange) {
    var wrapper = document.createElement('div');
    wrapper.className = 'table-filter';

    var input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Filter rows';
    input.setAttribute('aria-label', 'Filter table rows');
    wrapper.appendChild(input);

    table.parentNode.insertBefore(wrapper, table);

    input.addEventListener('input', function () {
      var needle = input.value.trim().toLowerCase();

      rows.forEach(function (row) {
        row.hidden = needle !== '' &&
          row.textContent.toLowerCase().indexOf(needle) === -1;
      });

      onChange();
    });
  }

  function upgrade(table) {
    var head = table.tHead;
    var body = table.tBodies[0];
    if (!head || !body || !head.rows.length) {
      return;
    }

    var rows = Array.prototype.slice.call(body.rows);
    if (!rows.length) {
      return;
    }

    // the last header row is the one holding the column labels
    var headers = Array.prototype.slice.call(head.rows[head.rows.length - 1].cells);
    var sortedBy = -1;
    var sortedDir = 'asc';

    function applySort(index, dir) {
      sortedBy = index;
      sortedDir = dir;

      sortRows(table, rows, index, dir);

      headers.forEach(function (header, i) {
        if (i === index) {
          header.setAttribute('aria-sort', dir === 'desc' ? 'descending' : 'ascending');
        } else {
          header.removeAttribute('aria-sort');
        }
      });

      restripe(rows);
    }

    headers.forEach(function (header, index) {
      header.tabIndex = 0;
      header.addEventListener('click', function () {
        applySort(index, sortedBy === index && sortedDir === 'asc' ? 'desc' : 'asc');
      });
      header.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          header.click();
        }
      });
    });

    addFilter(table, rows, function () {
      restripe(rows);
    });

    var initial = parseInt(table.getAttribute('data-sort-col'), 10);
    if (isNaN(initial)) {
      restripe(rows);
    } else {
      applySort(initial, table.getAttribute('data-sort-dir') === 'desc' ? 'desc' : 'asc');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('table.sortable'), upgrade);
  });
})();
// Reusable single-choice listbox. Values/labels are supplied by the page, never interpreted here.
(function (root) {
  root.CS2ChoicePicker = function (button, menu, labelId, onChange) {
    let choices = [],
      items = [];
    const node = (tag, text, className) => {
      const el = document.createElement(tag);
      if (text !== undefined) el.textContent = text;
      if (className) el.className = className;
      return el;
    };
    const dot = (value) => {
      const el = node('span', '●', 'category-dot');
      el.dataset.category = value;
      el.setAttribute('aria-hidden', 'true');
      return el;
    };
    const close = (focus = false) => {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (focus) button.focus();
    };
    function refresh() {
      const selected = choices.find(([value]) => value === button.value) ?? choices[0];
      if (!selected) return;
      button.value = selected[0];
      const label = node('span', selected[1], 'filter-value');
      label.id = labelId;
      const caret = node('span', '⌄', 'filter-caret');
      caret.setAttribute('aria-hidden', 'true');
      button.replaceChildren(dot(selected[0]), label, caret);
      items.forEach((item, i) =>
        item.setAttribute('aria-selected', String(choices[i][0] === selected[0])),
      );
    }
    const open = (last = false) => {
      if (!items.length) return;
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      const index = last
        ? items.length - 1
        : Math.max(
            0,
            choices.findIndex(([value]) => value === button.value),
          );
      items[index].focus();
    };
    button.addEventListener('click', () => (menu.hidden ? open() : close()));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open(event.key === 'ArrowUp');
      }
      if (event.key === 'Escape') close();
    });
    menu.addEventListener('keydown', (event) => {
      const index = items.indexOf(document.activeElement);
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % items.length;
      if (event.key === 'ArrowUp') next = (index + items.length - 1) % items.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = items.length - 1;
      if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey) {
        const prefix = event.key.toLocaleLowerCase();
        for (let step = 1; step <= items.length; step++) {
          const candidate = (index + step) % items.length;
          if (choices[candidate][1].toLocaleLowerCase().startsWith(prefix)) {
            next = candidate;
            break;
          }
        }
      }
      if (next !== undefined) {
        event.preventDefault();
        items[next]?.focus();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
      // Close without swallowing Tab: native focus order continues from the trigger.
      if (event.key === 'Tab') close(true);
    });
    document.addEventListener('pointerdown', (event) => {
      if (!button.contains(event.target) && !menu.contains(event.target)) close();
    });
    document.addEventListener('focusin', (event) => {
      if (!button.contains(event.target) && !menu.contains(event.target)) close();
    });
    button.addEventListener('change', refresh);
    return {
      update(options) {
        close(!menu.hidden && menu.contains(document.activeElement));
        choices = options;
        items = choices.map(([value, label]) => {
          const item = node('button', undefined, 'filter-option');
          item.type = 'button';
          item.tabIndex = -1;
          item.setAttribute('role', 'option');
          item.dataset.value = value;
          item.append(dot(value), node('span', label));
          item.addEventListener('click', () => {
            button.value = value;
            refresh();
            close(true);
            onChange();
          });
          return item;
        });
        menu.replaceChildren(...items);
        refresh();
      },
    };
  };
})(window);

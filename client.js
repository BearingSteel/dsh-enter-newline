window.__ModuleLoader__.load({
  id: 'dsh-enter-newline',
  factory() {
    const STYLE_ID = 'dsh-enter-newline-style';
    const TOOLTIP_MARK = 'data-dsh-enter-newline-tooltip';
    const LABEL_ATTR = 'data-dsh-enter-newline-label';
    const SHORTCUT_ATTR = 'data-dsh-enter-newline-shortcut';
    const ORIGINAL_ARIA_ATTR = 'data-dsh-enter-newline-original-aria';
    const ORIGINAL_ARIA_PRESENT_ATTR = 'data-dsh-enter-newline-original-aria-present';
    const COMPOSER_INPUT = '[data-composer-input]';
    const TRIGGER_MENU = '[data-trigger-menu]';
    const SHORTCUT_TEXT = 'Shift Enter';
    const SEND_LABELS = new Set([
      '发送消息',
      'Send message',
      'メッセージを送信',
      'Enviar mensaje',
      'Envoyer le message',
      'Nachricht senden',
      'Отправить сообщение',
      'Enviar mensagem',
      '排队发送',
      'Queue message',
      'メッセージをキューに追加',
      'mensaje de cola',
      "Message de file d'attente",
      'Warteschlangennachricht',
      'Сообщение в очереди',
      'Mensagem de fila',
      '插话发送',
      'Steer message',
      '実行中の指示にメッセージを追加',
      'Redirigir mensaje',
      'Guider avec ce message',
      'Mit Nachricht lenken',
      'Направить сообщение',
      'Orientar com mensagem'
    ]);

    /** @returns whether the primary pointer can hover the composer. */
    function isFinePointer() {
      return typeof window.matchMedia === 'function'
        && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }

    /** @param value - candidate event target. @returns whether it is a DOM element. */
    function isElement(value) {
      return value instanceof Element;
    }

    /**
     * Recognize the composer's Send action. The arrow path is the version-stable
     * cue; the translated labels are a fallback when the icon changes.
     * @param button - a button inside the composer card.
     * @returns whether this is the Send/Queue/Steer action.
     */
    function isSendButton(button) {
      if (button.closest('[data-composer-card]') === null) return false;
      const arrow = button.querySelector('svg path[d^="M8.3125"]');
      if (arrow !== null) return true;
      const label = (button.getAttribute('aria-label') || '').trim();
      return SEND_LABELS.has(label);
    }

    /**
     * Find the Send button whose tooltip is being shown from hover or focus.
     * @param label - visible tooltip label.
     * @returns the matching button, if it is currently hovered or focused.
     */
    function findSendButton(label) {
      const buttons = document.querySelectorAll('[data-composer-card] button');
      for (const button of buttons) {
        if (!(button instanceof HTMLButtonElement) || !isSendButton(button)) continue;
        if ((button.getAttribute('aria-label') || '').trim() !== label) continue;
        if (button === document.activeElement || button.matches(':hover')) return button;
      }
      return null;
    }

    /** @param tooltip - tooltip bubble. @param label - original label span. @param text - original label text. */
    function markTooltip(tooltip, label, text) {
      const shortcut = SHORTCUT_TEXT;
      if (!tooltip.hasAttribute(ORIGINAL_ARIA_ATTR)) {
        const original = tooltip.getAttribute('aria-label');
        tooltip.setAttribute(ORIGINAL_ARIA_PRESENT_ATTR, original === null ? '0' : '1');
        tooltip.setAttribute(ORIGINAL_ARIA_ATTR, original === null ? '' : original);
      }
      tooltip.setAttribute(TOOLTIP_MARK, '');
      tooltip.setAttribute(LABEL_ATTR, text);
      tooltip.setAttribute('aria-label', `${shortcut.replace(/\s+/g, ' ')} ${text}`);
      label.setAttribute(SHORTCUT_ATTR, shortcut);
    }

    /** @param tooltip - tooltip bubble to restore to its original content. */
    function unmarkTooltip(tooltip) {
      if (!tooltip.hasAttribute(TOOLTIP_MARK)) return;
      const present = tooltip.getAttribute(ORIGINAL_ARIA_PRESENT_ATTR) === '1';
      const original = tooltip.getAttribute(ORIGINAL_ARIA_ATTR);
      if (present && original !== null) tooltip.setAttribute('aria-label', original);
      else tooltip.removeAttribute('aria-label');
      tooltip.removeAttribute(TOOLTIP_MARK);
      tooltip.removeAttribute(LABEL_ATTR);
      tooltip.removeAttribute(ORIGINAL_ARIA_ATTR);
      tooltip.removeAttribute(ORIGINAL_ARIA_PRESENT_ATTR);
      for (const label of tooltip.querySelectorAll(`[${SHORTCUT_ATTR}]`)) {
        label.removeAttribute(SHORTCUT_ATTR);
      }
    }

    /**
     * Add the shortcut line to the tooltip bubble the composer already owns.
     * The generated line is CSS content, so React rerenders of the action label
     * do not erase it.
     */
    function syncTooltips() {
      if (!isFinePointer()) return;
      const shortcut = SHORTCUT_TEXT;
      for (const tooltip of document.querySelectorAll('[role="tooltip"]')) {
        if (!(tooltip instanceof HTMLElement)) continue;
        const label = tooltip.querySelector(':scope > span');
        if (!(label instanceof HTMLElement)) {
          unmarkTooltip(tooltip);
          continue;
        }
        const text = (label.textContent || '').trim();
        const marked = tooltip.hasAttribute(TOOLTIP_MARK);
        const markedText = tooltip.getAttribute(LABEL_ATTR) || '';
        const hasShortcut = label.getAttribute(SHORTCUT_ATTR) === shortcut;
        if (marked && text === markedText && hasShortcut) continue;
        if (marked) unmarkTooltip(tooltip);
        if (text === '' || findSendButton(text) === null) continue;
        markTooltip(tooltip, label, text);
      }
    }

    /** @param ctx - Client plugin context. */
    function apply(ctx) {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;

      let composing = false;
      let composingUntil = 0;
      let scheduled = false;
      const syntheticEvents = new WeakSet();

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
@media (hover: hover) and (pointer: fine) {
  [role="tooltip"][${TOOLTIP_MARK}] > span:first-child::before {
    content: attr(${SHORTCUT_ATTR});
    display: block;
  }
}
`;
      document.head.append(style);

      /** @param event - keydown event. @returns whether the composer is composing. */
      function isComposing(event) {
        return composing
          || Date.now() < composingUntil
          || event.isComposing
          || event.keyCode === 229
          || (isElement(event.target) && event.target.closest(COMPOSER_INPUT)?.hasAttribute('data-composer-composing') === true);
      }

      /** @param event - keydown event to route through the host composer keymap. */
      function dispatchHostGesture(event, input, shiftKey) {
        const synthetic = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          location: 0,
          bubbles: true,
          cancelable: true,
          composed: true,
          shiftKey,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
          repeat: event.repeat
        });
        try {
          Object.defineProperty(synthetic, 'keyCode', { configurable: true, get: () => 13 });
          Object.defineProperty(synthetic, 'which', { configurable: true, get: () => 13 });
        } catch {
          // Older engines may keep these legacy fields read-only; Lexical reads key/code instead.
        }
        syntheticEvents.add(synthetic);
        input.dispatchEvent(synthetic);
      }

      /** @param event - document-capture keydown. */
      function onKeyDown(event) {
        if (syntheticEvents.has(event) || event.key !== 'Enter' || event.defaultPrevented) return;
        if (!isElement(event.target)) return;
        const input = event.target.closest(COMPOSER_INPUT);
        if (!(input instanceof HTMLElement) || !input.isContentEditable) return;
        if (isComposing(event)) return;
        if (document.querySelector(TRIGGER_MENU) !== null) return;
        if (event.getModifierState('AltGraph')) return;

        const shift = event.shiftKey;
        if (shift) {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
        } else if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        dispatchHostGesture(event, input, !shift);
      }

      /** @param event - compositionstart event. */
      function onCompositionStart(event) {
        if (!isElement(event.target) || event.target.closest(COMPOSER_INPUT) === null) return;
        composing = true;
      }

      /** @param event - compositionend event. */
      function onCompositionEnd(event) {
        if (!isElement(event.target) || event.target.closest(COMPOSER_INPUT) === null) return;
        composing = false;
        composingUntil = Date.now() + 10;
      }

      /** Schedule one tooltip reconciliation after React commits a tooltip. */
      function scheduleSync() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          syncTooltips();
        });
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector('[role="tooltip"]') !== null) scheduleSync();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      const languageObserver = new MutationObserver(scheduleSync);
      languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

      document.addEventListener('keydown', onKeyDown, true);
      document.addEventListener('compositionstart', onCompositionStart, true);
      document.addEventListener('compositionend', onCompositionEnd, true);
      syncTooltips();

      ctx.effect(() => () => {
        observer.disconnect();
        languageObserver.disconnect();
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('compositionstart', onCompositionStart, true);
        document.removeEventListener('compositionend', onCompositionEnd, true);
        style.remove();
        for (const tooltip of document.querySelectorAll(`[${TOOLTIP_MARK}]`)) {
          unmarkTooltip(tooltip);
        }
      });
    }

    return { apply };
  }
});

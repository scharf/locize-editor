import { getClickedElement, getElementNamespace, getQueryVariable, removeNamespace } from './utils';
import { initUI, appendIframe } from './ui';

const defaultOptions = {
  url: 'https://www.locize.io',
  enabled: false,
  enableByQS: 'locize',
  toggleKeyCode: 24,
  toggleKeyModifier: 'ctrlKey',
  lngOverrideQS: 'useLng',
  autoOpen: true,
  mode: getQueryVariable('locizeMode') || 'iframe',
  iframeContainerStyle: 'z-index: 2000; position: fixed; top: 0; right: 0; bottom: 0; width: 500px; box-shadow: -3px 0 5px 0 rgba(0,0,0,0.5);',
  iframeStyle: 'height: 100%; width: 500px; border: none;',
  bodyStyle: 'margin-right: 505px;'
}

const editor = {
  type: '3rdParty',

  init(i18next) {
    this.enabled = false;
    this.i18next = i18next;
    this.options = { ...defaultOptions, ...i18next.options.editor };
    this.locizeUrl = (i18next.options.editor && i18next.options.editor.url) || 'https://www.locize.io';

    this.handler = this.handler.bind(this);

    if (this.options.enabled || (this.options.enableByQS && getQueryVariable(this.options.enableByQS) === 'true')) {
      setTimeout(() => {
        this.toggleUI = initUI(this.on.bind(this), this.off.bind(this), this.options);
        if (this.options.autoOpen) this.open();
        this.on();
      }, 500);
    }

    document.addEventListener('keypress', (e) => {
      if (e[this.options.toggleKeyModifier] && e.which === this.options.toggleKeyCode) this.enabled ? this.off() : this.on();
    });

    // listen to key press on locize service to disable
    window.addEventListener('message', (e) => {
      if (e.data[this.options.toggleKeyModifier] && e.data.which === this.options.toggleKeyCode) this.enabled ? this.off() : this.on();
    });
  },

  handler(e) {
    e.preventDefault();

    const el = getClickedElement(e);
    if (!el) return;

    const str = el.textContent || el.text.innerText;
    const res = str.replace(/\n +/g, '').trim();



    const send = () => {
      // consume
      // window.addEventListener('message', function(ev) {
      //   if (ev.data.message === 'searchForKey') {
      //     console.warn(ev.data);
      //   }
      // });
      const payload = {
        message: 'searchForKey',
        projectId: this.i18next.options.backend.projectId,
        version: this.i18next.options.backend.version || 'latest',
        lng: getQueryVariable(this.options.lngOverrideQS) || this.i18next.languages[0],
        ns: getElementNamespace(res, el, this.i18next),
        token: removeNamespace(res, this.i18next)
      };
      if (!payload.lng || payload.lng.toLowerCase() === 'cimode') payload.lng = this.i18next.options.backend.referenceLng;
      if (this.options.handler) return this.options.handler(payload);

      this.locizeInstance.postMessage(payload, this.options.url);
      this.locizeInstance.focus();
    }

    // assert the locizeInstance is still open
    if (this.options.autoOpen && (this.options.mode !== 'iframe' && !this.locizeInstance || this.locizeInstance.closed)) {
      this.open();
      setTimeout(() => {
        send();
      }, 3000);
    } else {
      send();
    }

  },

  open() {
    if (this.options.mode === "iframe") return this.locizeInstance = appendIframe(this.options.url, this.options);
    this.locizeInstance = window.open(this.options.url);
  },

  on() {
    document.body.addEventListener("click", this.handler);
    this.toggleUI(true);
    this.enabled = true;
  },

  off() {
    document.body.removeEventListener("click", this.handler);
    this.toggleUI(false);
    this.enabled = false;
  }
};

export default editor;

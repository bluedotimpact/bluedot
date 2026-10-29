import Alpine from 'alpinejs';
import { suggestEmailFix } from '@bluedot/utils/src/emailSuggestion';

type DataType = {
  $root: HTMLElement;
  suggestion: string | null;
};

document.addEventListener('alpine:init', () => {
  Alpine.data('emailSuggestion', () => ({
    suggestion: null as string | null,

    get suggestionLocalPart() {
      return this.suggestion?.slice(0, this.suggestion.lastIndexOf('@') + 1) ?? '';
    },

    get suggestionDomain() {
      return this.suggestion?.slice(this.suggestion.lastIndexOf('@') + 1) ?? '';
    },

    check(this: DataType, event: Event) {
      this.suggestion = suggestEmailFix((event.target as HTMLInputElement).value);
    },

    apply(this: DataType) {
      const input = this.$root.querySelector<HTMLInputElement>('input[type="email"]');
      if (input && this.suggestion) input.value = this.suggestion;
      this.suggestion = null;
    },
  }));
});

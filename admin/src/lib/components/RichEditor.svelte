<script lang="ts">
  import { onMount } from 'svelte';

  export let name: string;
  export let value: string = '';

  let editor: HTMLDivElement;
  let hiddenInput: HTMLInputElement;

  onMount(() => {
    if (editor && value) {
      editor.innerHTML = value;
    }
  });

  function exec(cmd: string) {
    document.execCommand(cmd, false, undefined);
    editor?.focus();
    sync();
  }

  function sync() {
    if (hiddenInput) hiddenInput.value = editor?.innerHTML ?? '';
  }

  function isActive(cmd: string) {
    return document.queryCommandState(cmd);
  }
</script>

<div class="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
  <!-- Toolbar -->
  <div class="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
    <button
      type="button"
      onclick={() => exec('bold')}
      class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-bold text-gray-700"
      title="Bold"
    >B</button>
    <button
      type="button"
      onclick={() => exec('italic')}
      class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm italic text-gray-700"
      title="Italic"
    >I</button>
    <button
      type="button"
      onclick={() => exec('underline')}
      class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm underline text-gray-700"
      title="Underline"
    >U</button>
    <div class="w-px h-5 bg-gray-300 mx-1"></div>
    <button
      type="button"
      onclick={() => exec('insertUnorderedList')}
      class="px-2 h-7 flex items-center rounded hover:bg-gray-200 text-xs text-gray-700"
      title="Bullet List"
    >• List</button>
    <button
      type="button"
      onclick={() => exec('insertOrderedList')}
      class="px-2 h-7 flex items-center rounded hover:bg-gray-200 text-xs text-gray-700"
      title="Numbered List"
    >1. List</button>
    <div class="w-px h-5 bg-gray-300 mx-1"></div>
    <button
      type="button"
      onclick={() => exec('removeFormat')}
      class="px-2 h-7 flex items-center rounded hover:bg-gray-200 text-xs text-gray-500"
      title="Clear formatting"
    >Clear</button>
  </div>

  <!-- Editable area -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={editor}
    contenteditable="true"
    role="textbox"
    aria-multiline="true"
    class="min-h-[150px] p-3 focus:outline-none text-sm text-gray-800 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
    oninput={sync}
    onblur={sync}
  ></div>
</div>

<input type="hidden" {name} bind:this={hiddenInput} value={value} />

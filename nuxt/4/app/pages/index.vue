<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
    <main class="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
      <img src="/nuxt.svg" alt="Nuxt logo" width="100" height="20" />
      <div class="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
        <h1 class="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          To get started, edit the pages.
        </h1>
        <p class="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Looking for a starting point? Head over to the
          <a
            href="https://nuxt.com/docs"
            class="font-medium text-zinc-950 dark:text-zinc-50"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nuxt Documentation
          </a>
          or the
          <a
            href="https://mion.io"
            class="font-medium text-zinc-950 dark:text-zinc-50"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mion Docs
          </a>.
        </p>
      </div>
      <div class="flex flex-col gap-4 text-base font-medium sm:flex-row">
        <NuxtLink
          class="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
          to="/mion-orders"
        >
          Mion
        </NuxtLink>
        <a
          class="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
          href="https://nuxt.com/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentation
        </a>
      </div>
    </main>
  </div>
</template>

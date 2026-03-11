<template>
  <div class="page-wrapper">
    <main class="page-main">
      <div class="logos">
        <img src="/nuxt.svg" alt="Nuxt logo"  height="60" />
        <span class="logo-separator">+</span>
        <img src="/mion-logo-dark.svg" alt="Mion logo"  height="60" />
      </div>
      <div class="content-section">
        <h1>To get started, edit the pages.</h1>
        <p>
          Looking for a starting point? Head over to the
          <a href="https://nuxt.com/docs" target="_blank" rel="noopener noreferrer">Nuxt Documentation</a>
          or the
          <a href="https://mion.io" target="_blank" rel="noopener noreferrer">Mion Docs</a>.
        </p>
      </div>
      <div class="actions">
        <NuxtLink class="btn btn-primary" to="/mion-orders">Mion Showcase</NuxtLink>
        <a class="btn btn-secondary" href="https://nuxt.com/docs" target="_blank" rel="noopener noreferrer">
          Documentation
        </a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-wrapper {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  font-family: system-ui, -apple-system, sans-serif;
}

.page-main {
  display: flex;
  min-height: 100vh;
  width: 100%;
  max-width: 48rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 4rem;
  background-color: #ffffff;
}

.logos {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-separator {
  font-size: 1.25rem;
  color: #d4d4d8;
}

.content-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}

.content-section h1 {
  max-width: 20rem;
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 2.5rem;
  letter-spacing: -0.025em;
  color: #000000;
  margin: 0;
}

.content-section p {
  max-width: 28rem;
  font-size: 1.125rem;
  line-height: 2rem;
  color: #52525b;
  margin: 0;
}

.content-section a {
  font-weight: 500;
  color: #09090b;
  text-decoration: none;
}

.content-section a:hover {
  text-decoration: underline;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 1rem;
  font-weight: 500;
  width: 100%;
  max-width: 340px;
}

.btn {
  display: flex;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0 1.25rem;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  font-weight: 500;
}

.btn-primary {
  background-color: var(--foreground);
  color: var(--background);
}

.btn-primary:hover {
  background-color: #383838;
}

.btn-secondary {
  background-color: transparent;
  color: var(--foreground);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.btn-secondary:hover {
  border-color: transparent;
  background-color: rgba(0, 0, 0, 0.04);
}

@media (min-width: 640px) {
  .page-main {
    align-items: flex-start;
  }

  .logos {
    align-self: flex-start;
  }

  .content-section {
    align-items: flex-start;
    text-align: left;
  }

  .actions {
    flex-direction: row;
    width: auto;
    max-width: none;
  }

  .btn {
    width: auto;
  }
}

@media (prefers-color-scheme: dark) {
  .page-wrapper {
    background-color: #000000;
  }

  .page-main {
    background-color: #000000;
  }

  .content-section h1 {
    color: #fafafa;
  }

  .content-section p {
    color: #a1a1aa;
  }

  .content-section a {
    color: #fafafa;
  }

  .btn-primary:hover {
    background-color: #cccccc;
  }

  .btn-secondary {
    border-color: rgba(255, 255, 255, 0.145);
  }

  .btn-secondary:hover {
    background-color: #1a1a1a;
  }

  .logo-separator {
    color: #52525b;
  }
}
</style>

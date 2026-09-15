// Keep Worker startup independent of corpus size. Static module loading caches
// the immutable application after the first request, without request-global state.
export default {
  async fetch(request: Request, env: { ASSETS?: Fetcher }) {
    const { default: application } = await import("./worker");
    return application.fetch(request, env);
  },
} satisfies ExportedHandler<{ ASSETS?: Fetcher }>;

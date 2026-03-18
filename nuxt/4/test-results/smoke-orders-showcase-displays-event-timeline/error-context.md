# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - status [ref=e4]
    - main [ref=e6]:
      - img "Mion logo" [ref=e7]
      - generic [ref=e8]:
        - heading "Mion Orders Showcase" [level=1] [ref=e9]
        - paragraph [ref=e10]:
          - link "Mion" [ref=e11] [cursor=pointer]:
            - /url: https://mion.io
          - text: is a lightweight TypeScript API framework with end-to-end type safety, automatic serialization, and built-in validation. This showcase demonstrates how
          - code [ref=e12]: routesFlow
          - text: resolves related data across multiple routes in a single HTTP request — a lightweight alternative to GraphQL, but fully typed and without a schema layer.
  - generic:
    - img
  - generic [ref=e13]:
    - button "Toggle Nuxt DevTools" [ref=e14] [cursor=pointer]:
      - img [ref=e15]
    - generic "Page load time" [ref=e18]:
      - generic [ref=e19]: "11"
      - generic [ref=e20]: ms
    - button "Toggle Component Inspector" [ref=e22] [cursor=pointer]:
      - img [ref=e23]
```
## Goal
On mobile, the hero search filters (Location, Property type, Price range) should always be visible — not hidden behind hover/focus. On desktop, keep current hover-to-expand behavior.

## Change
In `src/components/site/HeroSearch.tsx`, modify the collapsible filter wrapper (line 279):

Current classes hide filters by default and only reveal on hover/focus:
```
grid-rows-[0fr] opacity-0 ... group-hover/search:grid-rows-[1fr] group-hover/search:opacity-100 group-focus-within/search:...
```

Update so:
- On mobile (`< md`): filters always shown — `grid-rows-[1fr] opacity-100 mt-3`
- On `md+`: keep hover/focus reveal behavior

New classes:
```
mt-3 grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity,margin] duration-500 ease-out
md:mt-0 md:grid-rows-[0fr] md:opacity-0
md:group-hover/search:mt-3 md:group-hover/search:grid-rows-[1fr] md:group-hover/search:opacity-100
md:group-focus-within/search:mt-3 md:group-focus-within/search:grid-rows-[1fr] md:group-focus-within/search:opacity-100
```

No other files affected.
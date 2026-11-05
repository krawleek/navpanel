# Наше Здоровье — desktop prototype

Plain HTML, CSS and JavaScript. No build step or runtime dependencies.

```sh
npm run dev
```

Open http://localhost:5173. The desktop composition follows the supplied Figma section at a 1920×1080 design size, scaled to the available window. There is no mobile layout.

## Try the flow

- Search for «Махонин», «Вакцинация» or «Колоноскопия» using your keyboard or the onscreen keyboard.
- Open a doctor or service, then the route. Switch between the two route floors.
- Use the floor and zoom controls; drag the map after zooming in.
- Open the website/news QR panel, the eye banner's article QR, or clinic merchandise.
- Escape returns home. D plays the optional cursor walkthrough; Escape cancels it. T previews the inactivity warning. Normal sessions warn after 90 seconds, then return home after a further 15 seconds.

Direct previews use `?screen=home`, `suggestions`, `results`, `loading`, `empty`, `doctor`, `service`, `route1`, `route2`, `site`, `news`, `article`, `merch`, `closed`, `missing-doctor`, `missing-service`, or `timeout`. `?demo` starts the walkthrough.

## Scope

Search and navigation use local sample content from the Figma file. Routes are illustrative, as in the source designs. The source uses the same floor-plan illustration across floor states; this prototype preserves it. The news and website screens share the source's QR layout. QR artwork is preserved from Figma. No booking, purchase or other backend integration is included.

Motion uses StageShow's measured targets, cause-and-effect beats, short feedback and a held route payoff, implemented in vanilla JavaScript to honor the requested stack. Reduced-motion preferences keep states immediately legible and remove spatial transitions.

`npm run check` checks JavaScript syntax. Browser verification covers all 17 supplied screen states and the main search → doctor → route flow.

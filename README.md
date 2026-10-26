<p align="center">
  <img src="assets/styles.gif" alt="Claude, the little orange critter, playing out coding moments in all eleven styles: Pixel Art, the Original, Cave Painting, Blueprint, Mosaic, Frutiger Aero, Copperplate Engraving, Millefleur Tapestry, Golden Age Comic, Ukiyo-e and Kamon" width="960">
</p>

<h1 align="center">Claude Fables</h1>

<p align="center">
  <b>Your work, told as a cartoon while Claude codes.</b><br>
  A Claude Code mod for the desktop app that plays a small animated story in the band above the prompt.
</p>

<p align="center">
  <img alt="Claude Code mod" src="https://img.shields.io/badge/Claude_Code-mod-d97757">
  <img alt="Desktop app" src="https://img.shields.io/badge/runs_in-the_desktop_app-3b3a36">
  <img alt="42 styles" src="https://img.shields.io/badge/styles-42-6a5acd">
  <img alt="20 actions" src="https://img.shields.io/badge/actions-20-2e8b57">
  <img alt="7 scenes" src="https://img.shields.io/badge/scenes-7-c46a2a">
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#use">Use</a> ·
  <a href="#the-scenes">The scenes</a> ·
  <a href="#captions">Captions</a> ·
  <a href="#styles">Styles</a> ·
  <a href="#develop">Develop</a>
</p>

> [!NOTE]
> Claude Fables was developed entirely in Claude Code cloud environments and tested locally in the desktop app as well. Still, there may be bugs and rough edges. [Issues](https://github.com/henrik-thevibe/Claude-Fables/issues) and pull requests are very welcome.

While Claude works, Fables watches each tool call it makes and each line it says. Every few seconds it asks Sonnet (or Haiku, if you prefer) to retell the latest moment as a scene. Bug hunts turn into nature documentaries and bad regexes get pulled over by the train police. Claude appears as a small orange critter walking, sneaking or flying through the story. When the turn ends there is a closing scene, and it stays up for 30 seconds.

- **A scene every few seconds:** each tool call and line Claude says becomes a moment in a story.
- **20 actions:** Claude walks, sneaks, digs, trips, shrugs, sleeps and celebrates, matched to the work.
- **7 hand-lit scenes:** forest, space, city, desert, volcano, lab and night village.
- **42 styles:** from pixel art to ukiyo-e to liquid chrome, every element redrawn in the medium.
- **Captions that read like a terminal:** files, functions, numbers, failures and successes each set apart.
- **Safe by design:** the model writes data, never code, and a bad reply is simply skipped.

## Quick start

<p align="center"><img src="assets/install.gif" alt="Claude carrying a box across the desert: Moving into ~/code/Claude-Fables..." width="960"></p>

1. Clone this repo somewhere permanent, for example `~/code/Claude-Fables`.
2. Add it to the `env` block in `~/.claude/settings.json`:

   ```json
   {
     "env": {
       "CLAUDE_CODE_PLUGIN_DIRS": "/Users/you/code/Claude-Fables"
     }
   }
   ```

   To work on the mod with hot reload, also add `"CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"`.
3. Restart the desktop app and give Claude a task in the Code tab. The cartoon appears above the prompt after the first few seconds.

To try it from the terminal for one session instead, run `claude --plugin-dir ~/code/Claude-Fables`. Note that in the terminal the mod only watches and draws nothing.

## How it works

<p align="center"><img src="assets/how-it-works.gif" alt="Claude inspecting the activity log in a late-night lab" width="960"></p>

```
tool calls, Claude's own words ──► activity log (last 14 lines)
                                         │  as each scene is read, ≥5s apart
                                         ▼
        Sonnet or Haiku ($.model.complete) ──► JSON scene ──► parseScene (validate + clamp)
                                                                  │
                                                                  ▼
                                    sceneToSvg ──► one self-animating SVG (SMIL)
                                                                  │
                                                                  ▼
                                        <Svg isInteractive/> in the AbovePrompt band
```


- **The model writes data, not code.** Each scene is a small declarative JSON object: a backdrop, Claude's action, particles, a caption and its tone. `hooks/scene.ts` validates it strictly: unknown fields are dropped, numbers clamped, strings flattened and cut, and colors must be 3- or 6-digit hex. A bad reply can't break anything; it just doesn't show.
- **The animation runs inside the SVG.** `hooks/svg.ts` compiles a scene into one SVG document that animates itself with SMIL: walk cycles, bobbing, scrolling trains, twinkling stars, and a speech bubble that types itself out. Once the scene is drawn, the desktop needs no redraws for it.
- **Every line gets read.** Scenes play from a queue, one at a time. Each one stays up until its bubble has typed out and been on screen long enough to read, which takes longer for a longer caption. Nothing cuts in: not a failure, not the end of the turn, not the next prompt. The narrator asks for the next scene a little before the current one is read, timed to how quickly the model has been answering, so it is ready on time. A scene that comes back early waits in the queue. News (a failure, the turn ending) is asked for straight away and joins the queue behind the current scene. The narrator is told what the hero has just said, so the news breaks in within the story ("Wait-", "Oh!") rather than on screen. When a new prompt comes in, the scene that is up is still read through, and a closing scene still on its way plays before the new story starts. Once a turn is over, its last scene stays up for 30 seconds, then the band clears.

<details>
<summary><b>Under the hood:</b> queueing, smooth changes, caption fit, limits, sizing</summary>

- **Changes are smooth.** A scene in a new setting fades in from the last one; one in the same setting carries straight on. Each scene is drawn once and kept, so the desktop plays it through. The desktop draws the band again whenever its props change, and the end of a turn always changes them. So every redraw of a scene that is up (the turn ending, a resize, a new style) is set to the scene's own clock: the caption is exactly as far typed as it was, and Claude is exactly as far along.
- **Captions fit the bubble.** The narrator is asked for at most 70 characters. The hard limit is 80, the most the bubble shows whole in four lines. A longer caption is cut after its last full sentence, or else after a whole word with an ellipsis, never mid-word. The bubble always shows every word it is given.
- **It has limits.** Only one model request runs at a time, scenes come at least 5 seconds apart, and after errors it backs off exponentially, up to 60 seconds. The prompt is always bounded (the last 14 activity lines and the last 4 scenes), so a long session can't outgrow the context window.
- **It fits the window.** The band always gets a cartoon as wide as it is and 192 px tall. A wider window shows more of the scene, not a bigger one, so the art and the text stay the same size. Resizing the window redraws it.
- **Desktop only.** In the terminal the band is left exactly as the engine draws it.

</details>

<details>
<summary><b>The files</b></summary>

| File | What it does || --- | --- |
| `hooks/register.tsx` | The hooks: watches tool calls, replies and turns; draws the band; handles `/fables` |
| `hooks/narrator.ts` | The narrator's system prompt, prompt building, reply parsing, backoff |
| `hooks/director.ts` | The narrator's loop: what it remembers, when it asks, what it does with a reply. The plugin and the viewer run the same one |
| `hooks/activity.ts` | Boils each tool call down to one readable line |
| `hooks/scene.ts` | The scene format and its validator |
| `hooks/sprites.ts` | The pixel-art library: Claude in two walk frames, plus 30+ props |
| `hooks/svg.ts` | Scene → animated SVG: backdrops, particles, props, hero, caption |
| `hooks/looks.ts` | The looks: Pixel Art, the Original, and the registry of styles |
| `hooks/styles/*.ts` | The forty gallery styles, each an art bible: inks, how each kind of element is drawn, Claude, caption, tag, frame |
| `hooks/art/roles.ts`, `hooks/art/painter.ts`, `hooks/art/ink.ts` | The roles scenes paint their elements under, and the painter a style redraws them with |
| `hooks/grade.ts` | The medium a grid style sets the drawn stage into: tesserae or a weave |
| `hooks/clawd3d.ts` | The 3D Claude: the box model, its motions and its projection (ported from the gallery) |
| `hooks/hero3d.ts` | Bakes the posed 3D model into SVG frames that SMIL plays in turn |
| `hooks/scenery.ts` | The seven authored scenes: light maps, materials, reflections |
| `types/index.d.ts` | The scene types and the mod's `$.state` contract |

</details>

## Use

<p align="center"><img src="assets/use.gif" alt="Claude waving in the forest: /fables on, and hello!" width="960"></p>

- `/fables`: toggle the mod on or off. `/fables on` and `/fables off` also work. The setting is remembered across sessions.
- `/fables style <name>`: draw every scene in one of the styles below, for example `/fables style ukiyo-e` or `/fables style golden age`. `/fables style` lists them, and `/fables style off` goes back to the default, Pixel Art. It is remembered across sessions.
- `/fables pixel off` and `/fables pixel on` still work: they switch between the original look drawn smooth and its pixel art.
- `/fables model haiku` and `/fables model sonnet`: pick who writes the story. Sonnet is the default and writes wittier scenes; Haiku answers in about a second and costs less, but writes plainer captions and slips a little more often (a bad reply is simply skipped). `/fables model` shows which one is on. The choice is remembered across sessions; the config menu's **Scene model** (`pluginConfigs.fables.model`) sets the default.

Every scene is one small model request, so this costs a few requests per minute while Claude is working.

## The scenes

<p align="center"><img src="assets/scenes.gif" alt="A tour of the seven scenes: forest, space, city, desert, volcano, lab and night village" width="960"></p>

Claude is drawn as the gallery's 3D model: the same box body, arms, legs and pill eyes, lit and depth-sorted. The band's frame runs no script, so the model can't be drawn live. `hooks/clawd3d.ts` poses it 6 to 12 times per motion, `hooks/hero3d.ts` bakes each pose into flat SVG polygons, and the scene flips through them with SMIL. The model can't follow the cursor or be dragged; those need the live engine.

The narrator picks one of 20 actions for each scene, each tied to a kind of work:

| plays | actions |
|---|---|
| crossing the stage, from `from` to `to` | walk, run, fly, carry (moving files), sneak (bug hunts), jump, tumble (obstacles, retries) |
| in place, looping | dig (searching), inspect (reading and editing code), think, point (found it), peek, spin (refactors), wave (hello), sleep (long waits), panic (errors), dance, celebrate (milestones) |
| in place, once | trip (a test fails), shrug (nothing found) |

A scene can chain a second action with `then`, played in place where the first one ends: a sneak then a peek, a trip then a shrug, a jump then a celebration. Without one, Claude stands idle after crossing or after a one-off, and an idle Claude looks about, blinks, shifts its weight and stretches. Along the way its eyes go wide, narrow in focus, cross when it's dizzy and worry under a brow.

Each of the seven backdrops in `hooks/scenery.ts` is an authored scene with one brief, one light source and a small palette:

| Backdrop | The scene |
| --- | --- |
| forest | Dawn in an old forest: a low sun behind two rows of firs on brown trunks, mist between them, light falling through in shafts and pooling in a clearing, two great trunks framing the edges |
| space | Earthrise over a lunar outpost: a low sun rakes the regolith, so every swell has a lit crest, every crater a black bowl and a bright far wall, every rock a long shadow |
| city | Blue hour after rain: towers with lit west edges and dark east faces, offices lit a floor at a time, a spire, an elevated train, and the whole skyline mirrored in the wet street |
| desert | Mesa sunset: the sun sets in a notch the ranges leave clear, so they face us in violet shade with their sunward sides burning, and their shadows fan toward us across the sand |
| volcano | A night eruption: the crater lights its own ash column from beneath, lava runs down a gullied cone, and a stream crosses a black crust crazed with glowing cracks |
| lab | Working late: an architect's lamp warms the board-formed concrete and the bench, dust turns in its cone, rain beads on the window over a city opened into bokeh, and the polished floor mirrors the room |
| night | A sleeping village: hills under a high moon, cottages with one lit window and a thread of smoke, a great oak framing the view, fireflies |

<details>
<summary><b>How they are lit</b></summary>

Every surface is painted twice. First as light: a warm key where the light source reaches, cool shade facing away, deep tones where surfaces meet. Then that light map is multiplied by a material, built in an SVG filter from seeded noise cut into a small palette of related colors: needles, bark, grass, basalt, sandstone, sand, regolith, concrete, wood, asphalt. Light that has to brighten a dark material (shafts, lava glow, lamp pools) is added on top with a screen blend instead. Glows bloom, far layers sit slightly out of focus, rims of light appear only where the light can actually reach, and a lens pass adds fine grain and a vignette over the whole frame, Claude included.

Wet and polished floors reflect: the city's skyline and the lab's room are drawn once, then placed again upside down, blurred and broken by ripples, strongest in the puddles.

Depth comes from atmospheric perspective: further layers are lighter and nearer the sky's color. Focal points sit off the middle, so the middle of the stage, where Claude and the caption are, stays calm. Silhouettes come from smooth noise rather than repeated tiles, so there is no seam at any width. Everything is clipped to the stage, and motion is slow and belongs to the story.

The band's frame takes at most 131,072 characters, so repeated things are drawn once and placed many times: the firs, the grass clumps and the furthest tree line are templates. A scene that would still run over is redrawn leaner, then without particles, and as a last resort on the flat stage.

</details>

## Captions

<p align="center"><img src="assets/captions.gif" alt="Claude pointing at a caption that reads: npm test on dates.ts: 42/42 passed, 0 failed" width="960"></p>

The story is told in words. Props aren't drawn on the scene, so nothing competes with Claude and the caption.

The caption is one standard bubble of cartoon paper with a tail pointing at Claude, set in [Monocraft](https://github.com/IdreesInc/Monocraft) by Idrees Hassan (SIL Open Font License, `fonts/Monocraft-OFL.txt`), embedded as a 5 KB subset so it reads the same everywhere. It stays with Claude and never covers it: it takes a spot just beside, above or (for a flying Claude) below, checked against Claude's whole path, jumps and sways included. While Claude walks, the bubble walks along at the same distance, so its tail always points at Claude. Above Claude, it can sit anywhere along Claude's head, and a narrower wrap is tried, to find a spot the stage's edges never hold back. When a walk is too long for any spot, the bubble waits unseen until Claude is far enough in, then appears beside Claude and walks on with it. That wait is added to the scene's reading time. Inside it, kinds of words are set apart, so a caption reads like a terminal:

| Kind | Example | Looks like |
| --- | --- | --- |
| code and commands (in backticks, or a known command) | `npm test` | teal |
| files and paths | dates.ts, src/auth | blue |
| functions | daysInMonth() | purple |
| numbers and timings | 312, 2.41s, 42/42 | orange, bold |
| failures | failed, TypeError, N+1 | red, bold |
| successes | passed, clean, green | green, bold |
| ASCII faces and symbols | ^_^ >_< \o/ -> [OK] | warm accent |

The narrator also picks a tone for the moment. Trouble leads the caption with a red ✗ and a milestone with a green ✓; a celebration is a milestone unless it says otherwise. The narrator is asked to write like a developer, with backticks around code and the odd ASCII face.

<details>
<summary><b>The pixel-art pass</b></summary>

In the Pixel Art look (the default), the whole stage, scenery and Claude together, goes through a pixelizer: one SVG filter that samples the drawing at the middle of every two-unit square and spreads each sample over its square, so everything reads as pixel art without any of it being redrawn, and no blur washes the colors out. The grid starts at the stage's corner, so the pixels line up. Claude gets a sprite filter of its own on the same grid: its body sampled crisp, its eyes (finer than a pixel) found by their darkness and thickened just enough to land on whole pixels, and a one-pixel dark outline round it, as a pixel-art character would have. The caption sits above it all, already in pixel type, so it stays sharp. In the Original look, scenes are drawn smooth and the scenery takes a slight blur instead, so Claude and the caption read first.

</details>

## Styles

<p align="center"><img src="assets/styles-grid.png" alt="One still of each of the eleven styles, each labelled with its /fables style command" width="960"></p>

Two looks draw the authored scenes as they are: **Pixel Art** (`pixel`, the default) and the **Original** (`original`), the same scenes drawn smooth.

Forty more styles, from the [Claude Mascot Style Gallery](https://github.com/henrik-thevibe/Claude-Mascot-Style-Gallery), are artworks of their own. Each one redraws every element of every scene, Claude, the caption bubble, the chapter tag and the frame in its own medium, translated from the gallery's original plate. They are cosmetic only: the story, the scenery's composition and Claude's path stay as they are, and nothing is added to a scene.

| Style | `/fables style …` | The artwork |
| --- | --- | --- |
| Cave Painting | `cave` | Ochre, soot and pale earth rubbed thin on torch-lit limestone; no sky, only the wall; broken soot outlines; Claude in red ochre |
| Blueprint | `blueprint` | White line work on a cyanotype sheet; shade section-hatched, air and light as phantom lines; Claude as a patent drawing with hidden edges dashed |
| Mosaic | `mosaic` | Laid in the floor's stones and set as tesserae in grout, outlined in rows of dark stones; a meander border |
| Frutiger Aero | `aero` | Glossy gradients with a white rim on every surface, after the Vista and 7 wallpapers: an azure sky with a sun flare, Bliss-green grass, aqua glass towers, pearl rooms; Frutiger Aurora at night with teal meadows, moonlit clouds and bokeh stars; Claude as tangerine jelly |
| Copperplate Engraving | `engraving` | One sepia ink on laid paper, every tone cut as hatching along the grain of what it is; a plate mark |
| Millefleur Tapestry | `tapestry` | Woven in madder, woad, weld and walnut wool on the loom's grid; grass becomes the field of a thousand flowers |
| Golden Age Comic | `golden` | Flat newsprint inks, shade in Ben-Day dots, heavy keylines; a lettered balloon |
| Ukiyo-e | `ukiyoe` | Flat woodblock inks over a key line, bokashi skies, kasumi mist, a vermilion sun; a cartouche and seal |
| Kamon | `kamon` | Cream planes on black silk parted by cuts of one width; Claude as a crest; the vermilion hanko |
| Liquid Chrome | `chrome` | Millennium chrome, 1999: every solid thing chrome reflecting a blue sky over an orange desert, plants in mint chrome; an iridescent pink-to-cyan sky with twinkling sparkles, violet and magenta at night; a neon grid floor running to a white-hot horizon; the Earth a turning wireframe globe, the sun and moon chrome balls; Claude in chrome with a magenta shadow; a chrome wordmark and a shine sweeping across |
| Black-Figure | `blackfigure` | Glossy black slip on bare orange clay, details incised through it; added red and white, the far ranks in thinned slip; dot-rosettes for stars; Claude a black figure with a ribbed red lid; tongues, a Greek key and ΚΛΑΥΔΙΟΣ ΚΑΛΟΣ |
| Heraldry | `heraldry` | Flat tinctures outlined sable on a diapered azure field, shade hatched in Petra Sancta; a sun in splendour, estoiles Or, nebuly clouds, towers argent masoned; Claude gules fimbriated Or, armed and crowned; a bordure Or, a motto scroll and a parchment caption |
| Delftware | `delft` | Cobalt washes on tin glaze in a loose deep contour; hatched shadow masses; light left as wiped glaze; grass tufts, dotted paths, ripple strokes; windmill and church under a glaze moon; crackled tile joints, a double rule with ox-head corners, a banderole tag |
| Celestial Atlas | `atlas` | An old navy star chart: a conic grid, the dashed Æquator and a Milky Way of star clouds; Opus, Sonnet and Haiku as great stars lettered in italic Caslon; every light a star, clouds as dotted nebulae, fire in hand-coloured gold; Claude as the constellation CLAVDIVS; a graduated frame and a "Tab. I" cartouche |
| Chronophotography | `chrono` | Sepia albumen plates pasted along a foxed cream card, each with its own exposure, vignette, scratches and dust; a ruled, numbered backdrop; suns and lamps burnt out to halation; Claude the dark subject by day and pale under the flash by night, his earlier exposure a plate behind; a title slip and a ruled caption slip |
| Art Nouveau | `nouveau` | Flat pastel litho stones over a warm-brown contour that thickens with nearness; Mucha halos with gold dots and petal wreaths; whiplash pastel ribbons; gold sparkle stars; an arched cream panel with gold tendrils, lilies and a sage plaque |
| Cubism | `cubism` | Pasted papers cut straight, faux-bois, stipple and newsprint over a cream sheet; charcoal contours, guide lines and a heavy bar; a split ochre sun; Claude seen front and profile across a seam; a newspaper-scrap masthead and a "Clawd 13" signature |
| Bauhaus | `bauhaus` | Flat primary planes on a cream sheet, no outline; a diagonal band, a big circle holding the sun, moon or cone; a drifting red square, blue circle and yellow square; clouds and ash as bars with half discs, stars as cream squares; Claude on a heavy rule; a bold lowercase tag with a red square |
| Tattoo Flash | `tattoo` | Bold black line packed with flat flash inks on tea-stained paper; black whip shading; a sunburst behind a red-pointed sun, scalloped clouds, flash stars; hot-rod flames on Claude's back; a swallowtail banner with a rose and a pencilled price |
| Mid-Century Modern | `midcentury` | Flat screen-printed planes split into light and shade, banded teal skies, a split-disc sun, atomic starbursts; Harper firs and lollipop crowns on a mustard field; a faceted coral Clawd with a cardinal on his head; a cream mat and a slanted mustard tab |
| Op Art | `opart` | Black-and-white band fields only; a swelling Vasarely lens in the sky; chevron trees, Riley currents for grass and water, a checker city; a ring-target sun and Vega-sphere moons; the dark worlds drawn as negatives; a checker border |
| Pop Art | `popart` | Flat primaries and Ben-Day dot screens under a heavy black keyline; a blue dot-field sky; comic stars and puffy keyed clouds; glass as the comic mirror with white gleams; a jagged yellow burst; a yellow narration box and a thought-cloud caption |
| Contour Map | `contour` | Hypsometric tints ringed with brown contours and index contours; the sky a chart-blue Sea of Context with wave marks and shore ripples; woodland rings, hatched built-up areas, dashed shoals; a compass-rose sun and Mt. Prompt's spot height; a graduated neatline, north arrow and kilotoken scale bar |
| Enamel Pin | `pin` | Hard-enamel cells walled in lit gold wire; banded enamel skies with faceted gold star pins; glitter-enamel nights; Claude as a coral pin with a pearl lid and a gloss streak; a pink backing card with a hang slot, a terminal-window chapter pin |
| Atlas Glyph Tiles | `glyphs` | Every solid thing set in glyph tiles on one grid, each in a black gutter with a ■ or a thin /; signal orange on an azure field, stepped black shadows, blinking stray glyphs; a terminal band streaming tiles |
| Blob Mosaic | `blob` | Flat vivid tiles with darker grout on one flat chapter ground; black stepped shadows; sun, moon and Earth as blobs with glyph eyes; a bobbing crowd in the corners; a tile-lettered tag and a tiled caption panel |
| Phosphor Streams | `phosphor` | Glyph cells printed over the sampled scene; falling phosphor streams that stop at once; dim glyph masses with bright contours; a pale green Claude with black-cell eyes; a 01:29 clock, a scanline tube and a blinking prompt |
| Density Portrait | `density` | A black terminal of monospace cells streaming hex handles; the picture is only how brightly each character glows; far ranks sink into a near-empty field; amber type for fire and lamps; Claude in the densest type inside a margin of empty cells; a terminal pane with a status line and a prompt cursor |
| Density Field | `field` | A grid of monospace cells, each glyph of ` .:-=+*#` picked by brightness and set in its cell's dim tint; land a step denser for each step nearer, never past `=`; bright-blob suns; Claude in `#` and `*` phosphor with a ring of empty cells; drifting "Hi" packets; a shell-prompt tag and a box-drawn caption |
| Teletext Page | `teletext` | Mosaic blocks in teletext's eight colours on a black page; checker dithers for in-between tones and block grit for ground; banded skies; flashing plus-sign stars; a header row with a ticking clock and a Fastext row; a yellow-on-blue title band and a boxed subtitle |
| Maze War | `maze` | One-bit Alto bitmap, white and black only; wireframe planes with hidden lines knocked out; ordered dither for shadow and light; perspective maze floor; eyeball sun and moon; reverse video by night |
| Code Poem | `poem` | Every mass set in monospace letters lifted from the style's own source; old gold, phosphor and dim green inks on a dark terminal; sky as the poem's ghost text; stars, sparks, rain and fireflies as single glyphs; Claude in lettered faces; scanlines, bezel and blinking cursor |
| Tomb Painting | `tomb` | Flat earth pigments in a carbon contour; bare plaster by day, Nut's starred blue ceiling by night; Ra's disc and Khonsu's moon; Claude in ochre with a linen kilt and kohl eyes; khekher frieze, hieroglyph column, cartouche |
| Stained Glass | `glass` | Gothic lancet of leaded pot-metal glass; cobalt, ruby, gold and emerald panes; jeweled pane-field skies; grisaille detail; gold quatrefoil stars |
| Illuminated Initial | `initial` | Tempera and gold on vellum; ultramarine sky with gold diaper; gilded initial and ivy border; ink-lined flat pigments; flower-strewn fields; gold stars on lapis by night |
| Proportion Study | `proportion` | Foxed notebook paper; iron-gall ink with left-handed hatching; sfumato distance; red chalk fire; mirror writing and compass constructions; blue prepared paper with white chalk at night |
| Silhouette | `silhouette` | Cut-paper layers on cream card; depth told in paper tone; moonlit blue-grey night; gilt sun, moon, stars and fire; black portrait Claude with cut-through eyes; beaded gilt frame |
| Sampler | `sampler` | Cross-stitch on linen count, one cross per square; turkey red, indigo, leaf green, walnut, gold silk; indigo skies by day and night; stitched green-and-red border; captions on linen in a running stitch |
| Strongman Bill | `bill` | Two-colour letterpress, vermilion and black on foxed buff; woodcut line hatching along each grain; red block off register for fire, sun and lamps; black-ruled night sky with bare-paper stars; starred red banner and ruled notice captions |
| Constructivism | `constructivism` | Three inks on newsprint; halftone screens for tones; black diagonal sky bands; red sun disc, red night; Claude as a pasted photomontage cut-out; grotesque chapter on a red wedge |

<details>
<summary><b>How a style redraws a scene</b></summary>

Every element of a scene is handed to a painter under a *role* that says what it is and how deep it stands (`hooks/art/roles.ts`): a fir, a mist bank, a mesa, the lamp's cone, the wet street. The original looks keep the lit, photographic painting. A style's painter (`hooks/art/painter.ts`, `hooks/styles/*.ts`) reads that painting for its shapes and tones and draws it again:
- the lit look's blooms, materials and lens are left out;
- each lit color becomes one of the style's inks, wools, stones or threads, chosen by the element's family and depth;
- shapes take the style's line;
- what has no edge in the art form (sun and moon, mist, light, water) is redrawn by the style's own conventions.

Claude is drawn by each style's hero painter, from the 3D model's faces, its parts' outline hulls and its edges, which are classed as outline, crease or hidden as in the gallery's engine. A style made on a grid (Mosaic, Tapestry) names that grid as its medium: the drawn stage is set into tesserae or a weave, and its grout or the weave's ribs are laid over it. The narrator hears each style's voice, so a caption can sound like a 1938 comic or a woodblock print while still being about the real work.

The styles draw as fast as the original look or faster, since they leave out the lit look's material filters, and every one fits the band's size limit at every width.

</details>

## Develop

<p align="center"><img src="assets/develop.gif" alt="Claude digging by an erupting volcano: Digging through scripts/rehearse.ts" width="960"></p>

```sh
claude plugin validate .              # manifest, hooks and state contract
claude plugin test .                  # unit tests plus engine tests (stubbed Sonnet)
bun scripts/preview.ts > gallery.html # render sample scenes to a page in the browser
bun scripts/preview.ts --look all > styles.html # every look
```

`scripts/scenarios.ts` holds seven whole sessions: the prompt, each tool call and its result, Claude's words, and what Sonnet and what Haiku write back each time the narrator asks, as raw text, quirks included (code fences, a word of chatter, a missing caption, an empty answer). `scripts/rehearse.ts` plays a session through the narrator's own loop on a clock of its own, so the asks land when the plugin would make them, see exactly the prompt it would send, and bad replies are skipped and backed off from the same way. The viewer's **Sessions** tab shows it side by side: Claude Code's activity, the narrator's asks (with each prompt) and the model's replies (with each raw reply and the validator's verdict), the band, and a box to paste a reply of your own and see what the plugin would make of it. A test rehearses every session with both models. `bun scripts/preview.ts my-scenes.json` renders your own scenes, which is handy for tuning sprites or trying out what Sonnet sent back.

The mod API is early access and may change between Claude Code releases. This mod was built against Claude Code 2.1.287. If something stops drawing, run `claude --debug`: the log line will name what the engine refused.

The images in this README are drawn by the mod itself: `bun scripts/readme-gifs.ts` renders them to `assets/`. The launch video is made the same way; see [`video/`](video/README.md).

## Built in the cloud

<p align="center"><img src="assets/cloud.gif" alt="Claude flying over the moon: Built entirely in the cloud. Bugs may lurk." width="960"></p>

Claude Fables was developed entirely in Claude Code cloud environments: the mod, its tests, the scenes and styles, this README's images and the launch video. It was also tested locally in the desktop app, but there may still be bugs, and some may only show up on your setup. If something looks off, run `claude --debug` and [open an issue](https://github.com/henrik-thevibe/Claude-Fables/issues) with what the log says.

## Credits

- Claude's 3D model and its projection are ported from the gallery's engine by [ChetasLua](https://github.com/ChetasLua), under the MIT License.
- The forty gallery styles come from the [Claude Mascot Style Gallery](https://github.com/henrik-thevibe/Claude-Mascot-Style-Gallery).
- Captions are set in [Monocraft](https://github.com/IdreesInc/Monocraft) by Idrees Hassan, under the SIL Open Font License (`fonts/Monocraft-OFL.txt`).

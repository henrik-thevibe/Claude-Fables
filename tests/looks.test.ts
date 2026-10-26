import { describe, expect, test } from 'claude-code/testing'

import { buildPrompt } from '../hooks/narrator'
import { DEFAULT_LOOK, findLook, LOOK_NAMES, LOOKS, lookFor, STYLE_NAMES } from '../hooks/looks'
import { parseScene } from '../hooks/scene'
import { MAX_SVG, sceneToSvg } from '../hooks/svg'

const SCENE = {
  backdrop: 'forest',
  hero: { action: 'walk', from: 5, to: 35 },
  particles: { kind: 'leaves', density: 0.5 },
  caption: 'Chasing #abc through the undergrowth.',
  title: 'field notes',
  tone: 'work',
}
const BACKDROPS = ['forest', 'space', 'city', 'desert', 'volcano', 'lab', 'night']

describe('looks', () => {
  test('an unknown look draws the default', () => {
    expect(lookFor('no-such-look').name).toBe(DEFAULT_LOOK)
    expect(lookFor(undefined).name).toBe(DEFAULT_LOOK)
  })

  test('the forty-five styles are there, and found by any fair spelling', () => {
    expect(STYLE_NAMES.length).toBe(45)
    expect(findLook('Ukiyo-e')?.name).toBe('ukiyoe')
    expect(findLook('golden age')?.name).toBe('golden')
    expect(findLook('frutiger aero')?.name).toBe('aero')
    expect(findLook('copperplate')?.name).toBe('engraving')
    expect(findLook('millefleur')?.name).toBe('tapestry')
    expect(findLook('cave painting')?.name).toBe('cave')
    expect(findLook('Liquid Chrome')?.name).toBe('chrome')
    expect(findLook('chrome')?.name).toBe('chrome')
    expect(findLook('Black-Figure')?.name).toBe('blackfigure')
    expect(findLook('Heraldry')?.name).toBe('heraldry')
    expect(findLook('Delftware')?.name).toBe('delft')
    expect(findLook('Celestial Atlas')?.name).toBe('atlas')
    expect(findLook('Chronophotography')?.name).toBe('chrono')
    expect(findLook('Art Nouveau')?.name).toBe('nouveau')
    expect(findLook('Cubism')?.name).toBe('cubism')
    expect(findLook('Bauhaus')?.name).toBe('bauhaus')
    expect(findLook('Tattoo Flash')?.name).toBe('tattoo')
    expect(findLook('Mid-Century Modern')?.name).toBe('midcentury')
    expect(findLook('Op Art')?.name).toBe('opart')
    expect(findLook('Pop Art')?.name).toBe('popart')
    expect(findLook('Contour Map')?.name).toBe('contour')
    expect(findLook('Enamel Pin')?.name).toBe('pin')
    expect(findLook('Atlas Glyph Tiles')?.name).toBe('glyphs')
    expect(findLook('Blob Mosaic')?.name).toBe('blob')
    expect(findLook('Phosphor Streams')?.name).toBe('phosphor')
    expect(findLook('Density Portrait')?.name).toBe('density')
    expect(findLook('Density Field')?.name).toBe('field')
    expect(findLook('Teletext Page')?.name).toBe('teletext')
    expect(findLook('Maze War')?.name).toBe('maze')
    expect(findLook('Code Poem')?.name).toBe('poem')
    expect(findLook('Tomb Painting')?.name).toBe('tomb')
    expect(findLook('Stained Glass')?.name).toBe('glass')
    expect(findLook('Illuminated Initial')?.name).toBe('initial')
    expect(findLook('Proportion Study')?.name).toBe('proportion')
    expect(findLook('Silhouette')?.name).toBe('silhouette')
    expect(findLook('Sampler')?.name).toBe('sampler')
    expect(findLook('Strongman Bill')?.name).toBe('bill')
    expect(findLook('Constructivism')?.name).toBe('constructivism')
    expect(findLook('Art Deco')?.name).toBe('deco')
    expect(findLook('Neon')?.name).toBe('neon')
    expect(findLook('Silkscreen')?.name).toBe('silkscreen')
    expect(findLook('Line Printer')?.name).toBe('printer')
    expect(findLook('Handheld')?.name).toBe('handheld')
    expect(findLook('nonsense')).toBeUndefined()
  })

  test('every look is found by its own name and by its label, never another look', () => {
    for (const name of LOOK_NAMES) {
      const look = LOOKS[name]
      expect(findLook(name)?.name).toBe(name)
      expect(findLook(look?.label ?? '')?.name).toBe(name)
    }
  })

  test('every style draws every backdrop within the Svg limit, never pixelized, keeping the text', () => {
    for (const look of STYLE_NAMES) {
      for (const backdrop of BACKDROPS) {
        {
          const scene = parseScene({ ...SCENE, backdrop })
          if (!scene) throw new Error('expected a scene')
          const svg = sceneToSvg(scene, { width: 2400, height: 192, look, figure: '3d' })
          expect(svg.length).toBeLessThan(MAX_SVG)
          // A drafting hand letters in capitals.
          expect(svg.toLowerCase()).toContain('chasing #abc')
          expect(svg).toContain(`data-look="${look}"`)
          // A graded style runs its own filter when smooth; an artwork has none to run.
          if (LOOKS[look]?.grade) expect(svg).toContain('filter="url(#lk-grade)"')
          // Only the original look's own pixel style is pixelized.
          expect(svg).not.toContain('sc-pixelize')
          expect(svg.endsWith('</svg>')).toBe(true)
        }
      }
    }
  })

  test('a style drawn as art repaints every element, leaving none of the lit light or materials', () => {
    const arts = LOOK_NAMES.filter(name => LOOKS[name]?.art)
    expect(arts).toContain('ukiyoe')
    expect(arts).toContain('blueprint')
    for (const look of arts) {
      for (const backdrop of BACKDROPS) {
        {
          const scene = parseScene({ ...SCENE, backdrop })
          if (!scene) throw new Error('expected a scene')
          const svg = sceneToSvg(scene, { look, figure: '3d' })
          const lit = [...svg.matchAll(/filter="url\(#(sc-[\w-]+)\)"/g)].map(m => m[1])
          expect(lit).toEqual([])
          // The lit look's light is added in screen and overlay blends; a style's own textures may multiply.
          expect(svg).not.toMatch(/mix-blend-mode:(screen|overlay)/)
        }
      }
    }
  })

  test('ids are never defined twice in one drawing', () => {
    for (const look of LOOK_NAMES) {
      const scene = parseScene(SCENE)
      if (!scene) throw new Error('expected a scene')
      const svg = sceneToSvg(scene, { look, figure: '3d' })
      const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])
      expect(ids.length).toBe(new Set(ids).size)
    }
  })

  test('the default look changes nothing, and every style draws differently', () => {
    const scene = parseScene(SCENE)
    if (!scene) throw new Error('expected a scene')
    expect(sceneToSvg(scene, { look: DEFAULT_LOOK })).toBe(sceneToSvg(scene))
    expect(sceneToSvg(scene, { look: DEFAULT_LOOK, figure: '3d' })).not.toContain('data-look')
    const drawn = new Set(LOOK_NAMES.map(look => sceneToSvg(scene, { look, figure: '3d' })))
    expect(drawn.size).toBe(LOOK_NAMES.length)
  })

  test('the caption takes the style\'s bubble and inks', () => {
    const scene = parseScene({ ...SCENE, caption: 'Ran `npm test`: 3 failed' })
    if (!scene) throw new Error('expected a scene')
    const svg = sceneToSvg(scene, { look: 'golden', figure: '3d' })
    // The comic's balloon: newsprint white, lettered in capitals, code in the comic's blue.
    expect(svg).toContain('fill="#fffbe8"')
    expect(svg).toContain('<tspan fill="#1d3f8f">NPM</tspan>')
  })

  test('Liquid Chrome lays its neon grid on the ground, sparkles in the sky and Claude in chrome, at night too', () => {
    for (const backdrop of ['desert', 'night']) {
      const scene = parseScene({ ...SCENE, backdrop })
      if (!scene) throw new Error('expected a scene')
      const svg = sceneToSvg(scene, { look: 'chrome', figure: '3d' })
      // The grid is defined once and laid, masked, on each stretch of ground.
      expect(svg.match(/id="ch-grid"/g)?.length).toBe(1)
      expect(svg).toMatch(/<mask id="ch-mask\d+" style="mask-type:alpha">/)
      expect(svg).toContain('<use href="#ch-grid"/>')
      // Claude's faces reflect the sky and the desert, each in its own direction's chrome.
      expect(svg).toContain('url(#ch-f-top')
      expect(svg).toContain('url(#ch-f-front')
      expect(svg).toContain(backdrop === 'night' ? 'url(#ch-skyn)' : 'url(#ch-sky)')
    }
    // The Earth is a turning wireframe globe.
    const space = parseScene({ ...SCENE, backdrop: 'space' })
    if (!space) throw new Error('expected a scene')
    expect(sceneToSvg(space, { look: 'chrome', figure: '3d' })).toContain('<animate attributeName="rx"')
  })

  test('the narrator hears which style it writes for', () => {
    const look = LOOKS.ukiyoe
    if (!look) throw new Error('expected the ukiyoe look')
    expect(buildPrompt({ ask: 'x', log: [], story: [], look })).toContain('woodblock')
    expect(buildPrompt({ ask: 'x', log: [], story: [] })).not.toContain('style of')
  })
})

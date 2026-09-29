# Nintendo Level and Puzzle Design Philosophy (for Circuit Crew)

> **Method note for the report writer:** The network proxy blocked full-page fetches for every domain tried (gamedeveloper.com, nintendo.com, iwataasks.nintendo.com, wikipedia.org, engadget, gamesradar, nintendolife, shacknews, thumbsticks). So every finding below comes from **search-engine snippets and summaries** of the linked pages, not from reading the pages in full. Quotes are reproduced as the snippets gave them. Where a quote matters (for example the Hayashida quote), check it against the source before publishing. Sources are marked [PRIMARY] (the developer's own words, or a Nintendo or official publication), [PRIMARY-reported] (developer quotes reported by the press), or [SECONDARY] (analysis by a third party, such as GMTK, Medium or blogs).

## 1. Kishōtenketsu 4-step level structure (Hayashida, Super Mario 3D Land / 3D World)

### Takeaway
Koichi Hayashida describes each Mario level as a short story about one mechanic. The player learns it safely, then uses it in a harder setting, then meets a twist that makes them rethink it, and finally shows mastery. He links this to the four-part kishōtenketsu structure that Miyamoto taught from his comics background. Mark Brown's popular summary adds that the mechanic is usually "thrown away" after about five minutes.

### Cited Findings
- Hayashida's own statement [PRIMARY-reported, GDC 2012 / Game Developer interview]: "If you take a single gameplay element, let's think about the steps that happen. First, you have to learn how to use that gameplay mechanic, and then the stage will offer you a slightly more complicated scenario in which you have to use it. And then the next step is something crazy happens that makes you think about it in a way you weren't expecting. And then you get to demonstrate, finally, what sort of mastery you've gained over it." — [Game Developer: The Structure of Fun](https://www.gamedeveloper.com/design/the-structure-of-fun-learning-from-i-super-mario-3d-land-i-s-director)
- Hayashida said skill acquisition "often appears very similar to the way that a narrative can develop," and that this gives "the player a kind of narrative structure that they can relate to within a single level about how they're using a game mechanic." The article ties this to kishōtenketsu (four-line Chinese poems and four-panel Japanese comics). — [Game Developer: The Structure of Fun](https://www.gamedeveloper.com/design/the-structure-of-fun-learning-from-i-super-mario-3d-land-i-s-director)
- The concept came from Miyamoto, who drew comics as a child and "would always talk about" the third step, the *ten* (twist), "that really surprises people." Hayashida passed this on as one of several "Miyamoto-sayings" in his GDC 2012 talk. — [Game Developer: The secret to Mario level design](https://www.gamedeveloper.com/design/the-secret-to-i-mario-i-level-design); [GDC Vault: Thinking In 3D: The Development of Super Mario 3D Land](https://www.gdcvault.com/play/1015833/Thinking-In-3D-The-Development); [Nintendo Life: Hayashida explains origin of "Miyamoto's Teachings"](https://www.nintendolife.com/news/2014/02/super_mario_3d_world_director_koichi_hayashida_explains_the_origin_of_miyamotos_teachings)
- The rejected ideas Hayashida listed at GDC 2012 (a Koopa-shell half-pipe skate section, a cockroach you defeat by closing the 3DS, a giant Mario where you only see his legs, a stretched Mario) show that gimmicks were prototyped and cut freely. — [Game Developer: GDC 2012 Super Mario 3D Land: From adversity to joy](https://www.gamedeveloper.com/design/gdc-2012-i-super-mario-3d-land-i-from-adversity-to-joy)
- [SECONDARY, Mark Brown / Game Maker's Toolkit] The four steps in Super Mario 3D World:
  1. Introduce the concept somewhere safe where you can't lose a life.
  2. Use the same mechanic in a dangerous situation.
  3. Give it a twist.
  4. Conclude, often at the flagpole.

  Brown says the stages are "four-part, self-contained showcases for new ideas, where a mechanic can be successfully taught, developed, twisted and then thrown away in about five minutes flat." — [GMTK video archive](https://archive.org/details/SuperMario3DWorlds4StepLevelDesignGameMakersToolkit); [Nintendo Life coverage](https://www.nintendolife.com/news/2015/03/video_nintendos_four_step_stage_design_is_why_you_love_super_mario_games_so_much)
- [SECONDARY] Blog summary: Ki means a low-risk practice area, Shō means the mechanic "will evolve and become more complicated," Ten means "a twist on the mechanic… in a way they weren't expecting," and Ketsu means players "flaunt their skills," with optional collectibles on top. **Caution:** this source wrongly says Super Mario Galaxy was a Wii U game (it was on Wii), so treat its details as loose. — [Chris Norman, Medium](https://openedsource.medium.com/kish%C5%8Dtenketsu-hakoniwa-dd5a568da169)

### Inferences
- For Circuit Crew, one room could mean one circuit concept. For example, capacitors:
  - **Ki:** charge one capacitor to open one door, with nothing that can fail.
  - **Shō:** the capacitor discharges on a timer while you carry a cable across the room.
  - **Ten:** the capacitor is the *hazard*, and you must drain it before touching a breaker, or it powers something mid-transit.
  - **Ketsu:** a short showcase room that combines the pieces with a flourish, such as the lights coming on.
- The twist step is where puzzle games earn their "aha" moments. It is best built by flipping the mechanic's role (resource becomes hazard, source becomes sink), not by adding a new object.

### Gaps
- I could not read the full GDC 2012 talk or the Iwata Asks for Super Mario 3D Land (fetch blocked). I have no verbatim Hayashida examples naming specific 3D World levels as Ki/Shō/Ten/Ketsu. The level-by-level breakdowns come from secondary analysis (GMTK).

## 2. Teach-by-play: World 1-1, the Great Plateau, and avoiding text

### Takeaway
Nintendo teaches by building a situation where the right action is safe to try or nearly unavoidable. Designers "simulate what the player would do" and place objects so the player finds the rule unprompted. In World 1-1, the first Goomba and the question blocks teach avoiding and destroying enemies, and telling a harmful mushroom from a helpful one, within the first seconds. Breath of the Wild's Great Plateau is a walled-off, exploration-based tutorial. Its exit (the paraglider) is locked until four core-ability shrines are done.

### Cited Findings
- [PRIMARY-reported, Eurogamer 2015 interview with Miyamoto and Tezuka] The team considered how to teach several skills at once: avoiding enemies, destroying enemies, how question blocks work, and how to tell a Goomba from a helpful mushroom, all "within the first steps" of 1-1. Miyamoto: "We kept simulating what the player would do… So even within that one section, the player would understand the general concept of what Mario is supposed to be and what the game is about." — [Game Developer: How Miyamoto built World 1-1](https://www.gamedeveloper.com/design/how-miyamoto-built-i-super-mario-bros-i-legendary-world-1-1); [My Nintendo News summary](https://mynintendonews.com/2015/09/07/miyamoto-and-takashi-tezuka-talk-about-the-creation-of-super-mario-bros-world-1-1/)
- Miyamoto confirmed they wanted a "good" mushroom that makes Mario bigger and a "bad" mushroom, the Goomba. Tezuka: "It's a shiitake mushroom!" — [SoraNews24 on the 2015 interview video](https://soranews24.com/2015/09/09/super-mario-bros-creator-explains-how-and-why-he-designed-world-1-1-of-the-8-bit-classic-%E3%80%90video%E3%80%91/); [World 1-1 (Wikipedia)](https://en.wikipedia.org/wiki/World_1-1)
- A developer-interview translation of the same period is at [shmuplations: Super Mario Bros. 2015 Developer Interview](https://shmuplations.com/supermariobros/) (not fetched).
- The Great Plateau is the opening tutorial area. Unlike earlier Zelda tutorials, it "is largely exploration based and encourages players to experiment and go about their own path." It ends once the player completes four shrines, which earns the paraglider needed to leave safely. Critics widely call it one of the best tutorial areas. — [Great Plateau (Wikipedia)](https://en.wikipedia.org/wiki/Great_Plateau)
- [PRIMARY-reported, CEDEC 2017, Fujibayashi and lead artist Makoto Yonezu] The "triangle rule": obstacles are imagined as triangles you go over or around.
  - Large triangles are landmarks.
  - Medium triangles hide what lies ahead, which makes the player curious.
  - Small triangles set the "tempo" of play.

  This steers the player's attention without text. — [Nintendo Life](https://www.nintendolife.com/news/2017/10/zelda_breath_of_the_wilds_ingenious_design_is_all_about_triangles_apparently); [Kotaku](https://kotaku.com/breath-of-the-wilds-biggest-design-secret-lots-of-tria-1819113140)
- [PRIMARY-reported, HAL / Nintendo "Ask the Developer" for Kirby and the Forgotten Land] To make 3D readable, "If on the screen an attack looks like it hit an enemy, it will count as a hit even if it actually doesn't." The system takes camera and Kirby position into account. This is a "what it looks like wins" rule for depth ambiguity. — [Nintendo: Ask the Developer Vol. 4 Part 2](https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-4-kirby-and-the-forgotten-land-part-2/); [Nintendo Life](https://www.nintendolife.com/news/2022/03/random-hit-detection-is-pleasantly-forgiving-in-kirby-and-the-forgotten-land)
- Portal-like gating in Nintendo terms: the plateau's physical boundary, lifted only by the paraglider reward, is the gate. — [Great Plateau (Wikipedia)](https://en.wikipedia.org/wiki/Great_Plateau)

### Inferences
- **Circuit Crew's "1-1":** the first room should force one cable connection in a place where failing costs nothing, for example a short cable, one plug and one lamp in a doorway the player must pass. Then teach the *difference between* two similar-looking things, like a live cable versus a safe one, or a breaker versus a switch, the way the Goomba and Mushroom were paired.
- **Great Plateau pattern:** a closed "starter facility" with 3–4 mini-rooms, each teaching one verb (grab/carry, drag/route, breaker reset, capacitor), which unlocks the "main facility" door.
- **Kirby's forgiving hit rule, applied to grabbing:** in third-person 3D, snap a grab or plug to what *looks* connected from the camera's view. This avoids frustration from depth misjudgment when carrying cables to sockets.

### Gaps
- I found no direct developer quote on *why* BotW avoids text in the plateau. The "no text" framing comes from critics, not Nintendo. I could not confirm whether the "plateau as microcosm of the whole game" idea comes from a primary talk; one search summary said it may come from CEDEC 2017 rather than GDC 2017, which is unverified.

## 3. BotW/TotK multiplicative gameplay, the chemistry engine and Ultrahand

### Takeaway
BotW's "multiplicative gameplay" (Fujibayashi, GDC 2017) means objects react to the player *and to each other* through consistent physics and chemistry rules. That makes emergent, unplanned solutions possible. TotK took this further with Ultrahand: to let players join anything to anything, Nintendo made the whole world physics-driven, including gears and gates that were once scripted.

### Cited Findings
- [PRIMARY-reported, GDC 2017 "Breaking Conventions with The Legend of Zelda: Breath of the Wild", Fujibayashi, Takizawa, Dohta] Fujibayashi defines multiplicative design as "objects react to the player's action, and the objects themselves also influence each other." Examples include fanning a bomb to propel it and cutting down a tree to cross a gap. — [Game Developer video summary](https://www.gamedeveloper.com/design/video-designing-i-zelda-breath-of-the-wild-i-s-unconventional-mechanics); [Engadget](https://www.engadget.com/2017-03-12-breath-of-the-wild-gdc-talk.html)
- Dohta described a "chemistry engine" that governs elements (fire, water, ice, wind, electricity) and continuously updates object states. The three rules:
  1. Elements can change a material's state.
  2. Elements can change another element's state (water puts out fire).
  3. Materials cannot change other materials' state.

  — [Engadget](https://www.engadget.com/2017-03-12-breath-of-the-wild-gdc-talk.html); [Thumbsticks](https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies/)
- Full talk recordings: [Internet Archive](https://archive.org/details/gdc-2017-breaking-conventions-with-the-legend-of-zelda-breath-of-the-wild); [YouTube](https://www.youtube.com/watch?v=QyMsF31NdNc)
- Fujibayashi had Dohta build physics and chemistry into an NES-style top-down prototype to test the rules before full 3D. It was really a top-down view of a 3D simulation. — [Vice](https://www.vice.com/en/article/check-out-this-zelda-breath-of-the-wild-nes-style-prototype/); [Zelda Universe](https://zeldauniverse.net/2017/03/09/zelda-team-discusses-breath-of-the-wilds-development-and-2d-zelda-prototype-at-gdc/)
- [PRIMARY-reported, GDC 2024 TotK talk, Dohta, Takayama (physics), Osada (sound)] The team wanted to extend multiplicative gameplay "by allowing players to join multiple objects together." Their fix for Ultrahand was to remove every non-physics object from the game, including gears and gates that had never needed real physics. Their goals were "a fully physics-driven world" and "a system where unusual interactions could emerge without anyone coding them by hand." — [Digital Trends](https://www.digitaltrends.com/computing/how-nintendo-designed-tears-of-the-kingdom-physics/); [Shacknews recap](https://www.shacknews.com/article/139210/zelda-totk-gdc-2024-panel-recap); [Screen Rant](https://screenrant.com/zelda-totk-creators-gdc-2024-physics-building/)
- [PRIMARY-reported, Koizumi on Super Mario Odyssey] A parallel lesson from Mario: testers found unexpected capture uses such as shortcuts. "If the dev team found a trick to be interesting, they might actually put it into the game's specifications." Koizumi: "there isn't just one goal or one way of clearing it." — [Super Mario Odyssey (Wikipedia, citing interviews)](https://en.wikipedia.org/wiki/Super_Mario_Odyssey); [GeekDad interview](https://geekdad.com/2017/10/super-mario-odyssey-developer-interview/)

### Inferences
- **Circuit Crew's version of the chemistry engine:** define a small, consistent rule table. For example, power changes device state; water on a live cable spreads current; a capacitor stores and releases power; cables don't change other cables except when joined. Then check that every puzzle is solvable by rules the player already knows.
- **The TotK lesson:** if players can carry and drag physical cables, *every* interactive object (breakers, doors, fans) should be a real physics or state object, not a scripted one. That way unintended solutions still behave sensibly. Accept alternate solutions and write the good ones into the design, as Odyssey did.
- **Prototype in a stripped-down top-down or 2D sandbox** before building the full art pipeline, as BotW did.

### Gaps
- I had no verbatim transcript of the GDC 2017 "additive vs multiplicative" framing (if it exists) or of the TotK talk's specifics on joint and glue stability.

## 4. Captain Toad: Treasure Tracker (diorama rooms, camera, density)

### Takeaway
Captain Toad grew from a Super Mario 3D World prototype: a diorama viewed from outside, with a hero who *cannot jump*. That constraint kept stages small and dense. Director Shinya Hiratake likened the design to "packing a bento box." Rotating the camera is the main tool for finding secrets in a small space.

### Cited Findings
- [PRIMARY-reported] The idea began as a test during 3D World development: a diorama-like stage seen from outside. The team asked whether a game could work with a character who couldn't jump, "since if Mario could jump, the stages would become quite large." — [Nintendo Life interview](https://www.nintendolife.com/news/2014/12/interview_captain_toad_treasure_trackers_developers_talk_over_origins_and_the_contents_of_toads_backpack); [Game Developer: co-op in Captain Toad](https://www.gamedeveloper.com/design/how-co-op-was-introduced-in-i-captain-toad-treasure-tracker-i-)
- The goal was to "build a sandbox: a small, contained world that has a linear path, and someone that could not jump," which makes 3D exploration easier while keeping the world from getting too big. — [Nintendo Life interview](https://www.nintendolife.com/news/2014/12/interview_captain_toad_treasure_trackers_developers_talk_over_origins_and_the_contents_of_toads_backpack)
- Hiratake compared the design to "packing a bento box. Because you want to pack everything in but have to figure out the best way to get there." — same source; also [Nintendo Everything: Miiverse interview with Hiratake](https://nintendoeverything.com/captain-toad-treasure-tracker-miiverse-interview-with-director-shinya-hiratake/)
- Link was the first proposed hero but was rejected ("too courageous"). Miyamoto saw potential and later encouraged a full game. — [Nintendo Life 2018](https://www.nintendolife.com/news/2018/08/captain_toad_originally_starred_link_but_he_was_ltoo_courageousr_for_the_role); [Captain Toad (Wikipedia)](https://en.wikipedia.org/wiki/Captain_Toad:_Treasure_Tracker)
- Plucking was added for gameplay variety. Bonus challenges and collectibles were added to adjust difficulty. A stated goal was to make the game broadly accessible and "help normalize the use of camera control." — [Captain Toad (Wikipedia)](https://en.wikipedia.org/wiki/Captain_Toad:_Treasure_Tracker)

### Inferences
- **Circuit Crew rooms as dioramas:** a self-contained room that fits on screen, with a limited movement set (Toad can't jump; our crew may be weighed down while carrying). That keeps rooms compact enough to pack in several routing options.
- **Density through layers:** in Captain Toad, each stage has 3 gems plus a bonus objective. Circuit Crew could give each room a main "restore power" goal plus optional goals (under budget, no breaker trips, hidden fuse collectible) reachable by looking at the room from a new angle.
- **Camera rotation as a puzzle verb:** hide cable routes behind walls or under floors so that rotating the view is part of the solving.

### Gaps
- I couldn't retrieve a numeric count of secrets per stage from a primary source. "3 gems plus a bonus challenge" is common knowledge about the game, not verified in a fetched source here. I found no Iwata Asks dedicated to Captain Toad.

## 5. Pikmin (limited resources and time, parallel tasks, carrying logistics)

### Takeaway
Pikmin's core is *dandori*, the Japanese term for planning and ordering tasks efficiently. Players spread a limited workforce across parallel jobs under a daily time limit. Carrying objects back to base is the main logistics puzzle. Miyamoto describes balancing groups so that parallel carry jobs finish at the same time.

### Cited Findings
- The original Pikmin has a 30-day limit, with each day about 13 minutes. The game is about "using time as effectively as possible." — [Pikmin (video game), Wikipedia](https://en.wikipedia.org/wiki/Pikmin_(video_game))
- [PRIMARY-reported, Miyamoto, Pikmin 3] Players can have some Pikmin carry nearby bridge pieces while sending most to fetch pieces farther away. "if you get the balance right, both groups will finish what they are doing at about the same time." — [Niels 't Hooft: Pikmin 3 interview with Miyamoto](https://nielsthooft.com/miyamoto-pikmin); [4Gamer interview with Miyamoto, translation](https://www.tumblr.com/kamedani/56732554760/4gamer-interview-with-shigeru-miyamoto-part-2)
- The series essence is described as "Dandori": the ability to "organize tasks strategically and working effectively to execute plans." — [Game Informer: Pikmin 4 creators](https://gameinformer.com/afterwords/2023/10/02/pikmin-4s-creators-on-why-development-isnt-only-about-making-miyamoto-happy)
- Pikmin 2 added two leaders who can split up with their own squads to do multiple tasks at once. — [Pikmin 2, Wikipedia](https://en.wikipedia.org/wiki/Pikmin_2)

### Inferences
- **Power budgets as dandori:** a room's power budget works like a Pikmin count, and a capacitor's charge window works like the day timer. Puzzles can ask the player to *sequence* tasks: charge the capacitor, then carry the cable, then flip the breaker before it drains.
- **Carrying as spatial logistics:** cable length, weight and path around obstacles are the "carry route." Rooms should reward planning the route before picking up the cable.
- Solo play has no second leader, but "delegation" can be simulated with devices that run by themselves once powered, such as a conveyor that carries a fuse while the player routes a cable.

### Gaps
- I found no primary quote tying Pikmin's time limit to specific difficulty tuning. The 4Gamer and 't Hooft interviews were not read in full.

## 6. Level density: how many ideas per level, "one idea per level"

### Takeaway
Nintendo's Mario teams deliberately over-generate gimmicks and give each level its own. Super Mario Bros. Wonder aimed for at least one surprise in every course and collected about 2,000 sticky-note ideas from all staff. The "teach, develop, twist, discard" pattern means a mechanic is used for about one level. Odyssey built stages around gameplay systems first and added the visual theme later.

### Cited Findings
- [PRIMARY, Nintendo "Ask the Developer Vol. 11", Super Mario Bros. Wonder] The developers wanted at least one element in each course to surprise or delight players. Staff from every discipline wrote gameplay ideas on sticky notes, over 2,000 of them, and prototyped on the spot. They concluded "unless every single main course has a Wonder, they can't create a game that's packed with secrets and mysteries." — [Nintendo: Ask the Developer Vol. 11 Part 1](https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-11-super-mario-bros-wonder-part-1/); [Mario.nintendo.com version](https://mario.nintendo.com/news/ask-the-developer-vol-11-super-mario-bros-wonder-part-1/)
- [SECONDARY, GMTK] 3D World stages teach, develop, twist, and "throw away" a mechanic "in about five minutes flat." — [GMTK archive](https://archive.org/details/SuperMario3DWorlds4StepLevelDesignGameMakersToolkit)
- [PRIMARY-reported, Odyssey] The team first built stages around the gameplay systems and gimmicks they wanted, *then* gave them a scenery theme. Director Motokura: "there's a very great density of gameplay elements packed into this world." — [Super Mario Odyssey (Wikipedia, citing developer interviews)](https://en.wikipedia.org/wiki/Super_Mario_Odyssey); [GeekDad interview with Motokura and Koizumi](https://geekdad.com/2017/10/super-mario-odyssey-developer-interview/)
- [PRIMARY, Iwata Asks: Super Mario Galaxy 2] Mechanics are capped to protect level design. Cloud Mario can make only three cloud platforms, because unlimited clouds would let players reach any height. Hayashida had staff playtest stages regularly during about 2.5 years of prototyping. — [Iwata Asks: Galaxy 2 Vol. 2](https://iwataasks.nintendo.com/interviews/wii/supermariogalaxy2/1/0/); [Nintendo UK: "Mario Games Possess Variety"](https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Super-Mario-Galaxy-2/Volume-2-Koizumi-Motokura-Hayakawa-and-Hayashida/3-Mario-Games-Possess-Variety/3-Mario-Games-Possess-Variety-238089.html)
- Odyssey capture puzzles each use one captured enemy's ability: a Chain Chomp to break stone, a Bullet Bill to reach isolated pillars, a Cheep Cheep to explore underwater. — [Super Mario Odyssey (Wikipedia)](https://en.wikipedia.org/wiki/Super_Mario_Odyssey)

### Inferences
- **Design rule for Circuit Crew:** each room has one headline circuit idea. Earlier ideas may reappear as supporting elements, but the room is "about" one new thing. Ideas that fit in a single room should be spent there and not stretched thin.
- **Run a Wonder-style idea jam.** List many circuit gimmicks (a relay that flips a door, a fuse that must be sacrificed, a dimmer, a motor that pulls cables, polarity, series vs parallel lamps). Prototype cheaply and keep only the ones that support a full four-step arc.
- **Cap powerful verbs** the way Cloud Mario was capped. Limit cable length, splitter count or capacitor charges per room so a mechanic can't bypass the whole puzzle.
- **Build mechanics first, theme second**, as Odyssey did. Blockout the room around its gimmick before assigning its facility theme (kitchen, lab, boiler room).

### Gaps
- No primary source gives a numeric "one gimmick per level" rule for 3D World. The "then discarded" phrasing is GMTK's (secondary). No Iwata Asks page was fetched in full.

## 7. Other: Super Mario Maker's lessons on readable design, and Kirby

### Takeaway
Tezuka warns that creators underestimate difficulty because they already know the route. So playtesting with others is required, and Nintendo keeps extremely hard content to a small share. Kirby and the Forgotten Land solved 3D readability by judging hits from the camera's view.

### Cited Findings
- [PRIMARY-reported, Tezuka] Courses tend to be harder than intended, because the creator knows the best route and finds it easier than a first-time player does. Nintendo designs for a wide range of users, which limits very hard courses to "a fairly small part of the whole game." Tezuka likes simple courses, such as a bridge with Cheep Cheeps jumping one after another. — [Nintendo Life: Tezuka on hard levels](https://www.nintendolife.com/news/2015/10/takashi_tezuka_gives_his_opinion_on_hard_levels_made_with_super_mario_maker); [Game Informer: Tezuka interview 2019](https://gameinformer.com/2019/06/26/nintendo-legend-takashi-tezuka-talks-adding-themes-to-mario-maker-and-his-favorite-level)
- [PRIMARY, official Nintendo] Tezuka's Top 5 course tips:
  1. Don't worry too much about praise.
  2. Start by thinking of a name for your course.
  3. Look at others' courses.
  4. Use Story Mode for ideas.
  5. **Get opinions from others on your course.**

  — [Super Mario Maker 2 official site](https://supermariomaker.nintendo.com/news/mr-tezuka-super-mario-maker-tips/)
- [PRIMARY, Nintendo "Ask the Developer Vol. 4", Kirby and the Forgotten Land] Distance in depth is hard to judge in 3D, so hits count if they *look* like hits from the camera. Enemies were placed to surround Kirby, because 3D depth makes dodging easier and would otherwise lower difficulty. Yuki Endo, level design director, specified enemies and individual stage mechanics, then arranged them into stages. — [Nintendo: Ask the Developer Vol. 4 Part 2](https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-4-kirby-and-the-forgotten-land-part-2/); [Nintendo UK: Ask the Developer Vol. 4](https://www.nintendo.com/en-gb/News/2022/March/Ask-the-Developer-Vol-4-Kirby-and-the-Forgotten-Land-2187039.html)

### Inferences
- **Name each room for its idea**, following Tezuka's "start with a name" tip, for example "Short Circuit" or "The Long Way Round." That forces a single clear concept per room.
- **Blind-playtest every room**, since designers underestimate difficulty. Keep the hardest puzzles optional (bonus objectives), in line with Nintendo's "small part of the whole game" guidance.
- **Kirby's lesson for cable plugging and grabbing:** judge success from the player's view, using generous snap radii, so 3D depth doesn't cause failed plug attempts.

### Gaps
- I found no primary Nintendo source on Mario Maker's readability conventions (such as signposting with coins or arrows). Those are community and secondary knowledge. Nothing was found on Kirby's Mouthful Mode design from a primary source.

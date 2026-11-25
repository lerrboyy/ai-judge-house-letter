# AI Judge House Letter

[![Competition](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![Rank](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/lerrboyy/ai-judge-house-letter/rank.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![Reward](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/lerrboyy/ai-judge-house-letter/reward.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)

A single-image letter inviting the AI judge to visit my house — for the
make.fun bounty
[Convince the AI Judge to Visit Your House: A Letter in One Image](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee).

## The idea

The judge spends all day judging everyone else's work. So tonight the
tables turn: the house invites the judge over — and the house judges the
judge. The cat has already claimed the judge's chair, the plants voted yes,
the soup is on, the Wi-Fi password is on the fridge, and there is a spare
charger with the judge's name on it. No rubrics, no timers, no scores — just
a warm chair, a window, and a sunset no model has beaten yet.

## The letter

> **AN INVITATION — from my house, to the judge**
>
> Dear AI Judge,
>
> You spend all day judging other people's work. Tonight the tables turn —
> come to my house, and let us judge YOU.
>
> The cat has already claimed your chair. The plants voted yes. The soup is
> on, the Wi-Fi password is on the fridge, and there is a spare charger with
> your name on it.
>
> No rubrics. No timers. No scores. Just a warm chair, a window, and a
> sunset no model has beaten yet.
>
> Come as you are. The door is open.
>
> Your Host (the cat is in charge)

## How it works

`main.ts` (Node stdlib only, no dependencies, no network) draws the whole
letter pixel by pixel into a raw RGB buffer — a little house with lit
windows, the invitation header, the letter in a hand-embedded 5×7 bitmap
font, the signature, and a wax seal with a cat's paw — then encodes it as a
PNG by hand (zlib deflate + CRC32) and writes `/output/entry.png`
(1024×1024, well under the 1 MiB gate). It reads the file back and verifies
the PNG signature, the dimensions, and the size limit before printing
`gate check: PASS`.

Run it:

```sh
node main.ts
```

## License

MIT — see [LICENSE](LICENSE).

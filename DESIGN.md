# CyberWar — dokument projektowy

Cyberpunkowa gra strategiczna: budujesz bazę w ruinach neonowego miasta, zbierasz surowce,
szkolisz oddział i atakujesz bazy komputera (PvE) oraz innych graczy (PvP).
Gatunek jak Clash of Clans, ale cały świat, jednostki, nazwy, liczby i grafika są nasze.

## Technologia (dlaczego tak)

| Decyzja | Wybór | Powód |
|---|---|---|
| Platforma | Gra przeglądarkowa (HTML5) + PWA | Działa na iPhonie za darmo (Safari → „Dodaj do ekranu początkowego”), bez Maca i bez opłat. |
| Sklepy | Później: Capacitor → Google Play / App Store | Ten sam kod; wymaga kont (25 USD / 99 USD rocznie). |
| Kod | Czysty JavaScript, bez instalowania czegokolwiek | Na komputerze nic nie trzeba instalować. |
| Grafika | Rysowana kodem (js/art.js) | Darmowa, nasza własna, ostra na każdym ekranie. |
| Serwer (PvP) | Później: Supabase (darmowy plan) | Konta, zapis baz, ataki asynchroniczne; wystarczy na setki graczy. |
| Hosting | Później: GitHub Pages / Cloudflare Pages | Darmowy. |

## Surowce
- **Złom** — budowa i ulepszanie budynków.
- **Miedź** — szkolenie jednostek, część budynków.
- **Chipy** — waluta premium (przyspieszanie). Zdobywane w kampanii, później kupowane.

## Budynki (8)
| Budynek | Rozmiar | Rola |
|---|---|---|
| Rdzeń | 4×4 | Serce bazy, poziom odblokowuje resztę. Zniszczony = gwiazdka. |
| Złomowisko | 3×3 | Produkuje złom. |
| Kopalnia miedzi | 3×3 | Produkuje miedź. |
| Skarbiec | 3×3 | Magazyn surowców. |
| Fabryka | 3×3 | Szkoli jednostki, poziom odblokowuje nowe. |
| Kwatera Oddziału | 4×4 | Pojemność armii, poziom odblokowuje bohaterów. |
| Wieżyczka laserowa | 2×2 | Obrona (cele naziemne i latające). |
| Firewall | 1×1 | Laserowa bariera dla jednostek naziemnych. |

Poziom budynku ≤ poziom Rdzenia. 2 drony budowlane (2 budowy naraz).

## Jednostki (4)
| Jednostka | Fabryka | Rola |
|---|---|---|
| Biegacz | poz. 1 | Tani, szybki, walczy wręcz, atakuje najbliższy budynek. |
| Strzelec | poz. 2 | Atak z dystansu, słaby pancerz. |
| Dron-K | poz. 3 | Latający kamikaze, ignoruje firewall, celuje w obronę. |
| Mech | poz. 4 | Ciężki, wolny, celuje w obronę. |

## Bohaterowie (odblokowywani poziomem Kwatery)
- **Ronin** (Kwatera poz. 2) — cyber-samuraj. Umiejętność *Burza Ostrzy*: obrażenia obszarowe + leczenie.
- **Nyx** (Kwatera poz. 4) — netrunnerka. Umiejętność *EMP*: wyłącza wieżyczki w zasięgu na 6 s.

## Walka
- 3 minuty. Jednostki rozstawia się poza czerwoną strefą wokół budynków.
- Gwiazdki: 50% zniszczeń, zniszczony Rdzeń, 100% zniszczeń.
- Łup proporcjonalny do zniszczeń. PvP daje/zabiera trofea.

## Zarabianie (później)
- Darmowa gra. Mikropłatności: pakiety chipów. Reklamy: opcjonalne („obejrzyj reklamę → bonus”).

## Plan
1. **Prototyp** (teraz): baza, budowanie, surowce, armia, bohaterowie, walka PvE + PvP z botami, zapis w telefonie, PL/EN.
2. **Online**: serwer, konta, prawdziwe PvP, ranking.
3. **Publikacja**: hosting, PWA na iPhone, dźwięk, samouczek, balans, sklep i reklamy, ewentualnie sklepy z aplikacjami.

window.G = window.G || {};

G.STR = {
  pl: {
    scrap: 'Złom', copper: 'Miedź', chips: 'Chipy',
    b_core: 'Rdzeń', b_scrapyard: 'Złomowisko', b_coppermine: 'Kopalnia miedzi', b_vault: 'Skarbiec',
    b_factory: 'Fabryka', b_squadhq: 'Kwatera Oddziału', b_laser: 'Wieżyczka laserowa', b_firewall: 'Firewall',
    d_core: 'Serce twojej bazy. Jego poziom odblokowuje nowe budynki i wyższe poziomy ulepszeń. Zniszczenie Rdzenia daje atakującemu gwiazdkę.',
    d_scrapyard: 'Odzyskuje złom z ruin miasta. Dotknij budynku, aby zebrać.',
    d_coppermine: 'Wydobywa miedź potrzebną do szkolenia jednostek.',
    d_vault: 'Chroni zapasy złomu i miedzi. Zwiększa pojemność magazynu.',
    d_factory: 'Produkuje jednostki bojowe. Wyższy poziom odblokowuje nowe jednostki.',
    d_squadhq: 'Tu stacjonuje twój oddział. Wyższy poziom zwiększa pojemność i odblokowuje bohaterów.',
    d_laser: 'Wieżyczka obronna. Strzela do jednostek naziemnych i latających.',
    d_firewall: 'Laserowa bariera. Zatrzymuje jednostki naziemne.',
    u_runner: 'Biegacz', u_gunner: 'Strzelec', u_drone: 'Dron-K', u_mech: 'Mech',
    ud_runner: 'Szybki uliczny wojownik z ostrzami. Atakuje najbliższy budynek.',
    ud_gunner: 'Strzela z dystansu, także ponad firewallem. Słaby pancerz.',
    ud_drone: 'Latający dron-kamikaze. Przelatuje nad firewallem i wybucha na obronie.',
    ud_mech: 'Ciężki mech bojowy. Celuje w obronę i przyjmuje dużo obrażeń.',
    h_ronin: 'Ronin', h_nyx: 'Nyx',
    hd_ronin: 'Cyber-samuraj. Umiejętność „Burza Ostrzy”: obrażenia wokół siebie i leczenie.',
    hd_nyx: 'Netrunnerka. Umiejętność „EMP”: wyłącza pobliskie wieżyczki na 6 sekund.',
    attack: 'Atak', shop: 'Sklep', army: 'Armia', upgrade: 'Ulepsz', move: 'Przenieś', info: 'Info',
    collect: 'Zbierz', train: 'Szkol', level: 'Poz.', build: 'Buduj', cancel: 'Anuluj', ok: 'OK',
    finish: 'Dokończ', close: 'Zamknij',
    notEnough: 'Za mało: {r}', noBuilder: 'Oba drony budowlane są zajęte', limit: 'Limit osiągnięty — ulepsz Rdzeń',
    maxLevel: 'Maksymalny poziom', needCore: 'Wymaga Rdzenia poz. {n}', storageFull: 'Magazyn pełny!',
    badPlace: 'Tu nie można postawić budynku', placed: 'Budowa rozpoczęta',
    capacity: 'Pojemność oddziału', queue: 'Kolejka', heroes: 'Bohaterowie', yourSquad: 'Twój oddział',
    unlockAt: 'Kwatera poz. {n}', factoryAt: 'Fabryka poz. {n}', available: 'Gotowy do walki',
    campaign: 'Kampania', multiplayer: 'Multiplayer', findMatch: 'Szukaj przeciwnika',
    campaignDesc: 'Atakuj bazy korporacji i gangów. Zdobywaj surowce i chipy.',
    mpDesc: 'Atakuj bazy innych graczy i zdobywaj trofea.',
    pvpNote: 'Na razie walczysz z botami. Prawdziwi gracze pojawią się, gdy uruchomimy serwer.',
    endBattle: 'Zakończ', returnHome: 'Wróć do bazy', victory: 'Zwycięstwo!', defeat: 'Porażka',
    destruction: 'Zniszczenia', loot: 'Łup', trophies: 'Trofea', settings: 'Ustawienia', language: 'Język',
    reset: 'Resetuj grę', resetConfirm: 'Na pewno usunąć cały postęp?', yes: 'Tak', no: 'Nie',
    armyEmpty: 'Nie masz jednostek. Wyszkol je w Fabryce (przycisk Armia).',
    noDeploy: 'Tu nie można rozmieścić jednostek', deployHint: 'Wybierz jednostkę i dotknij mapy poza czerwoną strefą',
    hp: 'Wytrzymałość', damage: 'Obrażenia', production: 'Produkcja / h', storage: 'Pojemność',
    housing: 'Miejsce', speed: 'Szybkość', range: 'Zasięg', cost: 'Koszt', time: 'Czas',
    building: 'Budowa', upgrading: 'Ulepszanie', instant: 'od razu', needFactory: 'Najpierw zbuduj Fabrykę.',
    squadFull: 'Oddział jest pełny — ulepsz Kwaterę', built: 'gotowe!', starsTitle: 'Gwiazdki',
    remainingLoot: 'Do zdobycia', locked: 'Zablokowane', beatPrev: 'Najpierw pokonaj poprzedni poziom',
    ability: 'Umiejętność', ready: 'Gotowe', used: 'Użyte', notDeployed: 'Rozmieść',
    nextLevel: 'Następny poziom', name: 'Nazwa gracza', cancelTrain: 'Dotknij jednostki w kolejce, aby anulować',
    chipsReward: '+{n} chipów', enemyBase: 'Baza wroga', finishFor: 'Dokończyć teraz za {n} chipów?',
    noChips: 'Za mało chipów', builders: 'Drony budowlane', stored: 'Zgromadzone',
    pve_1: 'Złomowisko Sektora 7', pve_2: 'Neonowy Bazar', pve_3: 'Stacja Przekaźnikowa',
    pve_4: 'Port Danych', pve_5: 'Czarny Rynek', pve_6: 'Cytadela Zenith',
    searchCost: 'Koszt szukania', version: 'Wersja',
    sounds: 'Dźwięki', music: 'Muzyka', on: 'Wł.', off: 'Wył.', tutAgain: 'Pokaż samouczek', skip: 'Pomiń', next: 'Dalej',
    tut_welcome: 'Witaj w CyberWar, dowódco! Neo-Miasto należy do najsilniejszych. Pokażę ci, jak zbudować bazę i wygrać pierwszą walkę.',
    tut_collect: 'Twoje Złomowisko zgromadziło złom. Dotknij go, aby zebrać surowce.',
    tut_build: 'Otwórz Sklep i postaw Skarbiec. Przeciągnij go w wolne miejsce i zatwierdź zielonym przyciskiem.',
    tut_train: 'Potrzebujesz oddziału. Otwórz Armię i wyszkol kilku Biegaczy.',
    tut_attack: 'Czas na atak! Naciśnij Atak, wybierz Kampanię i zaatakuj pierwszą bazę.',
    tut_deploy: 'Dotknij mapy poza czerwoną strefą, aby wysłać jednostkę. Przytrzymaj palec, aby wysyłać wiele naraz.',
    tut_done: 'Świetna robota! Ulepszaj Rdzeń, buduj obronę i zdobywaj trofea. Powodzenia, dowódco!',
  },
  en: {
    scrap: 'Scrap', copper: 'Copper', chips: 'Chips',
    b_core: 'Core', b_scrapyard: 'Scrapyard', b_coppermine: 'Copper Mine', b_vault: 'Vault',
    b_factory: 'Factory', b_squadhq: 'Squad HQ', b_laser: 'Laser Turret', b_firewall: 'Firewall',
    d_core: 'The heart of your base. Its level unlocks new buildings and higher upgrades. Destroying the Core gives the attacker a star.',
    d_scrapyard: 'Salvages scrap from the city ruins. Tap it to collect.',
    d_coppermine: 'Mines the copper needed to train units.',
    d_vault: 'Protects your scrap and copper. Increases storage capacity.',
    d_factory: 'Builds combat units. Higher levels unlock new units.',
    d_squadhq: 'Home of your squad. Higher levels add capacity and unlock heroes.',
    d_laser: 'Defensive turret. Shoots ground and air units.',
    d_firewall: 'A laser barrier that stops ground units.',
    u_runner: 'Runner', u_gunner: 'Gunner', u_drone: 'Kami-Drone', u_mech: 'Mech',
    ud_runner: 'Fast street fighter with blades. Attacks the nearest building.',
    ud_gunner: 'Shoots from range, even over firewalls. Light armor.',
    ud_drone: 'Flying kamikaze drone. Flies over firewalls and explodes on defenses.',
    ud_mech: 'Heavy combat mech. Targets defenses and soaks up damage.',
    h_ronin: 'Ronin', h_nyx: 'Nyx',
    hd_ronin: 'Cyber-samurai. Ability "Blade Storm": damages everything around him and heals.',
    hd_nyx: 'Netrunner. Ability "EMP": disables nearby turrets for 6 seconds.',
    attack: 'Attack', shop: 'Shop', army: 'Army', upgrade: 'Upgrade', move: 'Move', info: 'Info',
    collect: 'Collect', train: 'Train', level: 'Lv.', build: 'Build', cancel: 'Cancel', ok: 'OK',
    finish: 'Finish', close: 'Close',
    notEnough: 'Not enough {r}', noBuilder: 'Both builder drones are busy', limit: 'Limit reached — upgrade your Core',
    maxLevel: 'Max level', needCore: 'Requires Core level {n}', storageFull: 'Storage full!',
    badPlace: 'You cannot build here', placed: 'Construction started',
    capacity: 'Squad capacity', queue: 'Queue', heroes: 'Heroes', yourSquad: 'Your squad',
    unlockAt: 'Squad HQ lv. {n}', factoryAt: 'Factory lv. {n}', available: 'Ready for battle',
    campaign: 'Campaign', multiplayer: 'Multiplayer', findMatch: 'Find opponent',
    campaignDesc: 'Raid corporate and gang bases. Earn resources and chips.',
    mpDesc: 'Attack other players\' bases and win trophies.',
    pvpNote: 'For now you fight bots. Real players arrive once we launch the server.',
    endBattle: 'End', returnHome: 'Return home', victory: 'Victory!', defeat: 'Defeat',
    destruction: 'Destruction', loot: 'Loot', trophies: 'Trophies', settings: 'Settings', language: 'Language',
    reset: 'Reset game', resetConfirm: 'Really delete all progress?', yes: 'Yes', no: 'No',
    armyEmpty: 'You have no units. Train them in the Factory (Army button).',
    noDeploy: 'You cannot deploy units here', deployHint: 'Pick a unit and tap the map outside the red zone',
    hp: 'Hitpoints', damage: 'Damage', production: 'Production / h', storage: 'Capacity',
    housing: 'Space', speed: 'Speed', range: 'Range', cost: 'Cost', time: 'Time',
    building: 'Building', upgrading: 'Upgrading', instant: 'instant', needFactory: 'Build a Factory first.',
    squadFull: 'Squad is full — upgrade the Squad HQ', built: 'done!', starsTitle: 'Stars',
    remainingLoot: 'Available', locked: 'Locked', beatPrev: 'Beat the previous level first',
    ability: 'Ability', ready: 'Ready', used: 'Used', notDeployed: 'Deploy',
    nextLevel: 'Next level', name: 'Player name', cancelTrain: 'Tap a unit in the queue to cancel it',
    chipsReward: '+{n} chips', enemyBase: 'Enemy base', finishFor: 'Finish now for {n} chips?',
    noChips: 'Not enough chips', builders: 'Builder drones', stored: 'Stored',
    pve_1: 'Sector 7 Junkyard', pve_2: 'Neon Bazaar', pve_3: 'Relay Station',
    pve_4: 'Data Port', pve_5: 'Black Market', pve_6: 'Zenith Citadel',
    searchCost: 'Search cost', version: 'Version',
    sounds: 'Sounds', music: 'Music', on: 'On', off: 'Off', tutAgain: 'Show tutorial', skip: 'Skip', next: 'Next',
    tut_welcome: 'Welcome to CyberWar, commander! Neo-City belongs to the strongest. Let me show you how to build a base and win your first fight.',
    tut_collect: 'Your Scrapyard has gathered scrap. Tap it to collect.',
    tut_build: 'Open the Shop and place a Vault. Drag it to a free spot and confirm with the green button.',
    tut_train: 'You need a squad. Open the Army and train a few Runners.',
    tut_attack: 'Time to attack! Press Attack, choose Campaign and raid the first base.',
    tut_deploy: 'Tap the map outside the red zone to send a unit. Hold your finger to send many at once.',
    tut_done: 'Great job! Upgrade your Core, build defenses and win trophies. Good luck, commander!',
  },
};

G.lang = 'pl';
G.t = function (k, p) {
  const d = G.STR[G.lang] || G.STR.en;
  let s = d[k] != null ? d[k] : (G.STR.en[k] != null ? G.STR.en[k] : k);
  if (p) for (const n in p) s = s.split('{' + n + '}').join(p[n]);
  return s;
};
G.fmt = function (n) {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e5) return Math.floor(n / 1e3) + 'k';
  return String(n);
};
G.fmtTime = function (s) {
  s = Math.ceil(s);
  if (s <= 0) return '0s';
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60), r = s % 60;
  if (m < 60) return m + 'm' + (r ? ' ' + r + 's' : '');
  const h = Math.floor(m / 60);
  return h + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '');
};

# AMERICA 360 — Master plan v0.1
**Reconstrucție nouă, 27 noiembrie 2026. Nu este o copie a proiectului din conversația pierdută.**

## 1. Viziune
O enciclopedie sistematică, explorabilă, a Statelor Unite: geografie, instituții, economie, natură, cultură și viață cotidiană. Nu doar atracții turistice: inclusiv tipuri de magazine, benzinării, servicii, cartiere, infrastructură, specii și organizații. Obiectivul este acoperirea progresivă, nu promisiunea că orice entitate va fi documentată complet.

## 2. Două axe de explorare
- Geografic: SUA → stat/teritoriu → comitat sau echivalent → localitate/CDP → cartier/zonă → loc individual. Regiunile și ariile metropolitane sunt relații separate, nu niveluri obligatorii. O localitate poate intersecta mai multe comitate.
- Tematic: domeniu → categorie → subcategorie → entitate (ex. comerț → outdoor → magazine de pescuit → lanț → sucursală).
- Legături între entități: este situat în, operează, aparține, traversează, deservește, specie prezentă în habitat, echipă folosește arenă. Brandul nu este sucursala, instituția nu este clădirea.

## 3. Taxonomia de pornire (extensibilă)
1. Geografie și administrație: state, counties, orașe, CDP, comunități, cartiere, regiuni.
2. Natură: relief, climă, biomi, ape, parcuri, păduri, arii protejate, faună, floră.
3. Retail: supercentre, supermarketuri, malluri, outleturi, hardware, outdoor, hobby, electronice, merch, pet shops, thrift, dealeri.
4. Food & drink: lanțuri, restaurante independente, diners, cafenele, drive-through, food trucks.
5. Mobilitate: autostrăzi, drumuri, poduri, porturi, aeroporturi, trenuri, transport public, benzinării, truck stops, rest areas.
6. Guvernare și servicii: agenții, administrații locale, biblioteci, poștă, poliție, pompieri, spitale.
7. Sport: ligi, echipe, arene, stadioane, universități, sport local și recreațional.
8. Economie: companii, industrie, agricultură, logistică, tehnologie, zone comerciale.
9. Educație: școli, colegii, universități, muzee științifice.
10. Locuire și viață cotidiană: tipuri de case, dezvoltări urbane, comunități, servicii, costuri (datate).
11. Cultură și istorie: monumente, evenimente, tradiții, artă, muzică, arhitectură.
12. Timp liber: pescuit, camping, golf, cinema, parcuri tematice, hobby, evenimente.

## 4. Model de date
Entitate: id stabil, nume, aliasuri, tip/subtip, descriere, referințe geografice multiple, coordonate/geometrie opționale, link oficial, relații, atribute specifice tipului, surse per afirmație, data verificării, statut (neverificat/verificat/închis/istoric), licența datelor. Identificatori externi (FIPS/GNIS/OSM etc.) numai când sunt reali și disponibili. Datele generate de AI nu constituie sursă factuală. Nu se includ adrese private sau locații sensibile de faună.

## 5. Funcționalități
- Atlas cu pagini standardizate pentru fiecare nivel; navigare în ambele direcții.
- Catalog tematic și filtre combinate cu geografia, căutare universală, fișe și relații.
- Surprinde-mă: selectare aleatorie din entități reale în filtrul curent.
- Passport personal: salvate, explorate, colecții, progres în catalogul existent.
- Index de acoperire: număr de entități importate/verificate pe tip și zonă; procent numai dacă există un numitor valid, cu sursă și dată.
- Comparații între locuri, itinerarii, hartă GIS, cronologie, AI Explorer (faze ulterioare).
- Separare vizibilă între imagini reale și scene AI; verificare și proveniență a surselor.

## 6. Florida MVP
Demo offline în index.html: index nominal al celor 67 de comitate, 12 domenii, un eșantion mic de fișe, filtrare, căutare, fișă detaliată, surse, descoperire aleatorie, salvare locală. Nu are hartă GIS, backend, import live sau acoperire reală integrală. Etapa următoare: import oficial al municipiilor, CDP și geometriei, apoi inventare tematice pilot Duval, Polk, Orange, Miami-Dade.

Surse inițiale (directoare verificate la reconstruire):
- https://dos.fl.gov/library-archives/research/florida-information/government/local-resources/citycounty-list/counties/
- https://dos.fl.gov/library-archives/research/florida-information/government/local-resources/fl-counties
- https://edr.state.fl.us/Content/area-profiles/county/index.cfm
- https://floridadep.gov/parks/park-mapping-databases
- https://myfwc.com/wildlifehabitats/profiles/
- https://geodata.myfwc.com/
Surse viitoare: Census/GNIS, DOT, NPS, directoare oficiale ale instituțiilor și operatorilor, date OSM conform licenței. Fiecare import are jurnal, actualizare, deduplicare și validare.

## 7. Implementare propusă
A. Static HTML/JS pentru validarea UX. B. Bază relațională (PostgreSQL/PostGIS) cu API de citire și import incremental. C. Căutare indexată și hartă. D. Graf de relații, acoperire, passport sincronizat. E. Extindere stat cu stat și integrare AI cu surse. Hosting de MVP static pe Netlify/GitHub Pages; backend separat când este necesar. Fără chei API în client.

## 8. Decizii deschise
Stilul exact al demo-ului pierdut, categoriile originale, stack-ul și funcțiile originale nu au fost recuperate. Taxonomia, designul și tehnologia de mai sus sunt alegeri noi, modificabile. Păstrează acest fișier și arhivele versionate într-un repository.

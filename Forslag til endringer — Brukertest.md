# Forslag til endringer i brukertestoppgaver

Basert på gjennomgang av prototypen (index.html → studiesider → handlekurv → sok-skjema.html → kvitteringsside).

---

## Overordnet vurdering

Brukertestdokumentet har en god struktur og dekker de viktigste stegene i søknadsflyten. Men flere oppgaver refererer til studier eller emner som ikke finnes i prototypen, og noen oppgaver er vagt formulert. Her er konkrete forslag.

---

## 1. «Søke på studieprogram» — oppdater til riktig studienavn

**Nåværende oppgave:** «Du er interessert i sikkerhet og IT og ønsker å søke på bachelor i Cybersikkerhet i Oslo.»

**Vurdering:** Studiesiden for «Cybersikkerhet – Bachelor» finnes i prototypen. Denne oppgaven fungerer. Men vurder om dere vil at brukeren skal starte fra forsiden (index.html) og navigere via studietilbudsiden, eller om dere lander dem direkte på studiesiden. Det påvirker hva dere faktisk tester.

**Forslag:**
- Spesifiser startpunktet tydeligere: «Du befinner deg på forsiden til Kristiania.no. Du er interessert i sikkerhet og IT og ønsker å søke på en bachelorgrad i Cybersikkerhet som du kan ta i Oslo. Finn studiet og legg det til i søknaden din.»
- Dette tester navigasjon via studietilbudsiden OG «Søk nå»-knappen med byvalgsflyten.

---

## 2. «Søke på studieprogram + nettemne» — bruk studier som finnes i prototypen

**Nåværende oppgave:** «Du ønsker å søke på bachelor i markedsføring i Oslo. I tillegg ønsker du å ta emne innenfor markedsføring på nett.»

**Problem:** Prototypen har «Digital markedsføring og salgsledelse – Bachelor» (ikke «Bachelor i markedsføring»), og den er tilgjengelig i Oslo. For nettdelen finnes det nettstudier som «Administrasjon og ledelse» og «Anvendt psykologi» med valgbare enkeltemner. Det er uklart om det faktisk finnes nettbaserte markedsføring-emner i prototypen som enkeltemoduler.

**Forslag:**
- Endre til to steg som faktisk lar seg gjøre i prototypen: «Du ønsker å søke på bachelor i Digital markedsføring og salgsledelse i Oslo. I tillegg vil du ta et nettemne i Anvendt psykologi. Legg begge deler til i søknaden.»
- Alternativt: sjekk hvilke emner som kan legges til fra nettstudiesidene, og bruk et faktisk emnenavn.
- Fordelen med å bruke to forskjellige fagfelt er at det tester om brukeren forstår at man kan kombinere stedbaserte og nettbaserte studier i én søknad.

---

## 3. «Endre handlekurven» — bruk faktiske emnenavn fra prototypen

**Nåværende oppgave:** «Du har ombestemt deg og vil ikke ta emnet 'markedsføring', men heller 'biopolitikk'.»

**Problem:** Dokumentet sier selv «Bytt ut med emner vi har i prototypen». Handlekurv-prototypen viser «Bedriftsøkonomi» (under Bachelor i Markedsføring) og «Innføring i programmering» (enkeltemne). Det finnes ingen emner kalt «markedsføring» eller «biopolitikk».

**Forslag:**
- «Du har ombestemt deg. Du vil fjerne emnet 'Bedriftsøkonomi' fra handlekurven. Hvordan gjør du det?»
- Hold det enkelt — test én handling om gangen. Å fjerne + legge til i samme oppgave tester to ting samtidig og gjør det vanskeligere å isolere problemer.
- Vurder en ekstra oppgave: «Du vil i tillegg legge til et annet emne. Gå tilbake og legg til et nytt emne i søknaden din.»

---

## 4. «Velg oppstartsdato» — konkretiser scenarioet

**Nåværende oppgave:** Tre kulepunkter: utenfor Lånekassens semester, innenfor høstsemesteret, endre oppstartsdato.

**Problem:** Oppgaven er formulert som en intern sjekkliste, ikke som en oppgave brukeren kan utføre. Studiestart-modalen (studiestart-modal.js) har to scenarioer: «approaching semester» (nær semesterstart med faste datoer 16. januar / 16. august) og «between semesters» (mellom semestre med kalenderpicker).

**Forslag — splitt i to oppgaver:**

**Oppgave 4a (innenfor semester):** «Når du legger til et nettemne, får du velge oppstartsdato. Velg en dato som passer for deg. Hva tenker du om valgene du får?»
- *Observer: Velger de den foreslåtte datoen? Leser de informasjonen om Lånekassen?*

**Oppgave 4b (utenfor semester):** «Tenk deg at du ønsker å starte 1. oktober i stedet. Hva skjer? Hva betyr det for deg?»
- *Observer: Forstår de varselet om at Lånekassen ikke dekker denne perioden? Endrer de mening?*

---

## 5. «Lagre til senere» — fungerer, men legg til realistisk kontekst

**Nåværende oppgave:** «Du kommer på at du må lage middag, men vil ikke miste valgene du har gjort. Hva gjør du?»

**Vurdering:** Bra formulert. «Lagre til senere»-knappen finnes i handlekurven og åpner et e-postfelt. Men oppgaven bør spesifisere *hvor* i flyten brukeren er — er de i handlekurven eller i søknadsskjemaet?

**Forslag:**
- Endre til: «Du er i handlekurven og har lagt til studiene dine. Du kommer på at du må lage middag og vil ikke miste det du har valgt. Hva gjør du?»
- Merk: «Lagre til senere» finnes bare i handlekurven (basket.js), ikke i selve søknadsskjemaet. Hvis brukeren allerede har gått videre til skjemaet, finnes det ingen slik knapp. Det er i seg selv et interessant funn å teste.

---

## 6. «Gå videre i søknaden» — tydeliggjør hva som skal skje

**Nåværende oppgave:** «Du er ferdig med middagen og skal fortsette søknaden. Hva gjør du?»

**Vurdering:** Hypotesen sier at brukerne enten logger inn eller bruker e-posten. I prototypen sender «Lagre til senere» en bekreftelse med en lenke. Oppgaven er OK, men forutsetter at brukeren faktisk fullførte lagringen i forrige steg.

**Forslag:**
- Legg til et hint om at de har fått en e-post: «Det har gått en time. Du vil fortsette med søknaden. Du har fått en e-post fra Kristiania. Hva gjør du?»
- Eventuelt: forbered en mock-e-post i prototypen som testdeltakeren kan «åpne».

---

## 7. «Fyll ut personopplysninger» — formuler som en reell oppgave

**Nåværende oppgave:** «Bruker de logg inn-knapp? Fyller de inn personopplysninger?» + ufullstendig hypotese.

**Problem:** Dette er notater til moderator, ikke en oppgave til brukeren. Prototypen har to innloggingsmetoder: FEIDE og telefonnummer (med auto-utfylling av personopplysninger via 1881-simulering). Skjemaet har seksjoner for Kontakt, Personopplysninger og Adresse.

**Forslag — reformuler som brukeroppgave:**
- «Du er nå i søknadsskjemaet. Fyll ut opplysningene dine og gå videre.»
- *Observer: Bruker de FEIDE-innlogging eller telefonnummeret? Forstår de at opplysningene hentes automatisk? Korrigerer de noe?*
- Fullfør hypotesen: «Vi tror at søkere forstår at de kan bruke FEIDE eller telefonnummer for å forenkle utfyllingen, og at de opplever auto-utfyllingen som tidsbesparende og trygg.»

---

## 8. «Rabattkode» — oppgaven fungerer, men juster observasjon

**Nåværende oppgave:** Obs om å se om de legger merke til feltet, deretter: «Du har fått 20 % rabatt via koden RABATT20. Bruk den.»

**Vurdering:** I prototypen er rabattkodefunksjonaliteten en skjult toggle-knapp («Har du en rabattkode?») nederst i betalingsseksjonen. Den åpner et inputfelt. Fungerer bra som oppgave.

**Forslag — ingen stor endring, men:**
- Legg til at moderator skal notere: *Så de «Har du en rabattkode»-lenken uten hjelp? Hvis ja — hvor raskt?*
- Rabattkodefeltet vises kun hvis det finnes emner å betale for (betalingsseksjonen for emner). Sørg for at brukeren har nettemner i handlekurven, ellers er feltet skjult.

---

## 9. «Se sammendrag» — tydeliggjør at det er en sidebar

**Nåværende oppgave:** «Du vil dobbeltsjekke at du søker riktige emner/studieprogram før du betaler, hvor sjekker du dette?»

**Vurdering:** Sammendraget er en sticky sidebar til høyre i desktop-visningen med tittelen «Sammendrag av søknad». Den er klikkbar/ekspanderbar. Oppgaven er bra.

**Forslag — mindre justering:**
- Endre «før du betaler» til «før du sender inn» — i prototypen er knappen «Send søknaden», ikke en betalingsknapp. Brukeren betaler ikke direkte (studieprogram faktureres per semester).

---

## 10. «Betaling» — spesifiser hva som er synlig

**Nåværende oppgave:** «Betal for det som må betales for. Hva tenker du om de ulike betalingsmåtene?»

**Vurdering:** Betalingsseksjonen i prototypen har to deler: studieprogram (faktureres per semester, ingen valg) og emner (kortbetaling, avdrag, faktura, arbeidsgiver/NAV). Kortalternativet ekspanderer med felt for kortnummer, utløpsdato, CVC og navn.

**Forslag:**
- «Du ser nå betalingsdelen av søknaden. Hva legger du merke til? Hvordan ville du betalt for emnene dine?»
- *Observer: Forstår de forskjellen mellom fakturering av studieprogram og betaling av enkeltemner? Reagerer de på prisvisningen?*
- Fjern «Lånekassen?» som eget punkt — det dekkes bedre under oppgave 4 om studiestart.

---

## 11. «Bekreftelsessiden» — oppgaven fungerer, men legg til oppfølgingsspørsmål

**Nåværende oppgave:** «Søknaden er sendt inn. Hva forventer du skjer videre?»

**Vurdering:** Kvitteringssiden viser: «Takk for din søknad!», en opplisting av det de søkte på, «Du vil motta en bekreftelse på din e-post», og en knapp «Gå til Mitt Kristiania».

**Forslag — legg til:**
- «Hva ville du gjort nå? Trykk gjerne der du ville trykket.»
- *Observer: Klikker de på «Gå til Mitt Kristiania»? Forstår de hva «Mitt Kristiania» er? Føler de seg ferdige?*

---

## Generelle forslag

**Rekkefølge:** Oppgavene følger allerede den naturlige flyten, men det mangler en tydelig overgang mellom handlekurv og søknadsskjema. Vurder å legge til en observasjonsoppgave: «Du har lagt til alt du vil søke på. Gå videre med søknaden.» — dette tester om «Gå videre med søknaden»-knappen i handlekurven er tydelig.

**Manglende hypotese for oppgave 7:** Fyll ut hypotesen for personopplysninger (den står som «Vi tror at...»).

**Pre-seed handlekurven:** Flere oppgaver forutsetter at handlekurven allerede har innhold. Avklar om prototypen pre-seeder localStorage med studier, eller om brukeren må legge til alt selv. Anbefaling: la brukeren legge til Cybersikkerhet selv (oppgave 1), men pre-seed resten for å spare tid.

**Mobil vs. desktop:** Handlekurv-prototypen (handlekurv.html) er designet som en mobilvisning (440px ramme), mens søknadsskjemaet er desktop med sidebar. Avklar hvilken enhet dere tester på og sørg for konsistens.

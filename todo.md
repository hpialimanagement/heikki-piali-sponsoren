# Sponsoring Management - TODO

## Phase 1: Datenbank & Backend
- [x] Datenbank-Schema mit Sponsoren-Tabelle erstellen (Firmenname, Ansprechpartner, Email, Notizen, Status, Daten)
- [x] tRPC-Routen für Sponsoren-CRUD implementieren (create, read, update, delete, list)
- [x] Status-Enum definieren (Noch nicht kontaktiert, E-Mail in Vorbereitung, E-Mail gesendet, Antwort erhalten, Absage, Zusage/Partner)
- [x] Datum-Tracking implementieren (Email-Versand, Antworteingang)
- [x] Backend-Tests schreiben (Auth + Sponsor CRUD mit Authentifizierung)

## Phase 2: Authentifizierung & Passwortschutz
- [x] Passwort-Authentifizierung implementieren (Management67)
- [x] Session-Management ohne OAuth
- [x] Login-Seite mit Passwort-Input
- [x] Logout-Funktionalität

## Phase 3: Frontend-Dashboard
- [x] Dashboard-Layout mit Sidebar erstellen
- [x] Sponsoren-Übersichtstabelle mit allen Feldern
- [x] Status-Filter und Suchfunktion
- [x] Add/Edit/Delete Modal für Sponsoren
- [x] Notiz-/Kommentarfeld pro Sponsor
- [x] Dashboard-Statistiken (kontaktiert, Antworten, Absagen, Partner)
- [x] Responsive Design

## Phase 4: Finalisierung
- [x] Alle Features testen (14 Tests bestanden)
- [x] Checkpoint erstellen (Version: 5796b832)
- [x] Auf GitHub pushen (Repository erstellt: heikki-sponsoring-management)
- [x] Ergebnis an Benutzer liefern (Website bereit zum Veröffentlichen)

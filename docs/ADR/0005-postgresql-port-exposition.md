# ADR-0005 — Exposition de PostgreSQL sur 127.0.0.1 pour accès TablePlus

## Statut
Accepté

## Contexte
PostgreSQL tourne dans le réseau Docker interne (root_default) sur le VPS.
Aucun port n'était exposé hors du réseau Docker, rendant impossible la connexion
depuis TablePlus via tunnel SSH. L'IP interne Docker est dynamique et change
à chaque redémarrage.

## Décision
Exposer PostgreSQL uniquement sur 127.0.0.1:5432 dans docker-compose.yml :
ports:
  - "127.0.0.1:5432:5432"

## Conséquences
- TablePlus peut se connecter via tunnel SSH en utilisant localhost comme host
- PostgreSQL n'est pas exposé sur internet (127.0.0.1 = loopback uniquement)
- Le host TablePlus est stable et ne dépend plus de l'IP Docker dynamique
- Tout accès externe à la BDD passe obligatoirement par SSH

## Alternatives rejetées
- /etc/hosts avec l'IP Docker : rejeté car l'IP change à chaque redémarrage
- Fixer l'IP Docker via ipv4_address : rejeté, solution fragile et couplée au sous-réseau

## Référence
docs/tunnel-ssh-postgres-docker.md

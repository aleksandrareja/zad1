#etap 1
#wykorzystujemy lekki obraz Alpine
FROM alpine:3.21 AS builder

#ustawienie katalogu roboczego wewnątrz kontenera
WORKDIR /app
#kopiowanie plików źródłowych aplikacji do etapu builder
COPY server.js index.html ./


#etap 2
FROM alpine:3.21

ARG TZ=Europe/Warsaw

#aktualizacja systemu i instalacja Node.js
#'apk upgrade' kluczowe dla załatania luk bezpieczeństwa
#'--no-cache' zapobiega zapisywaniu plików instalacyjnych
#rm -rf' ręczne usunięcie pozostałości cache'u w tej samej warstwie
RUN apk update && apk upgrade && apk add --no-cache nodejs && rm -rf /var/cache/apk/* && addgroup -S appgroup && adduser -S appuser -G appgroup

ENV TZ=${TZ}

LABEL org.opencontainers.image.authors="Aleksandra Reja"

WORKDIR /app

#kopiowanie wyłącznie niezbędnych plików z etapu builder.
COPY --from=builder --chown=appuser:appgroup /app/server.js /app/index.html ./

USER appuser

#port, na którym nasłuchuje serwer Node.js
EXPOSE 3000

#healthcheck bez curla
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); })"

ENTRYPOINT ["node"]
CMD ["server.js"]
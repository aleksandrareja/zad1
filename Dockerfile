FROM alpine:3.21 AS builder
WORKDIR /app
COPY server.js index.html ./


#etap 2
FROM alpine:3.21

#instalacja tylko nodejs bez yarn, --no-cache zeby pliki instalacyjne nie zostaly w obrazie
RUN apk update && apk upgrade && apk add --no-cache nodejs

LABEL org.opencontainers.image.authors="Aleksandra Reja"

WORKDIR /app

COPY --from=builder /app/server.js /app/index.html ./

EXPOSE 3000

#healthcheck bez curla
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); })"

CMD ["node", "server.js"]
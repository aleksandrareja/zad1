const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');

const PORT = 3000;
const AUTOR = "Aleksandra Reja";

//Logi
const dataStartu = new Date().toLocaleString();
console.log(`Data uruchomienia: ${dataStartu}`);
console.log(`Autor programu: ${AUTOR}`);
console.log(`Aplikacja nasłuchuje na porcie: ${PORT}`);

const getJSON = (apiUrl) => {
    return new Promise((resolve, reject) => {
        https.get(apiUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', (err) => reject(err));
    });
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    //Healthcheck
    if (parsedUrl.pathname === '/health') {
        res.writeHead(200);
        res.end('OK');
        return;
    }

    //Obsuga api
    if (parsedUrl.pathname === '/api/weather' && req.method === 'GET') {
        const { city } = parsedUrl.query;

        //Geokodowanie
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pl&format=json`;

        getJSON(geoUrl)
            .then(geoData => {
                if (!geoData.results || geoData.results.length === 0) throw new Error("Nie znaleziono miasta");
                const { latitude, longitude, name, country } = geoData.results[0];

                //Pobieranie aktualnej pogody
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
                return getJSON(weatherUrl).then(w => ({ ...w, locationName: `${name}, ${country}` }));
            })
            .then(weatherData => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    location: weatherData.locationName,
                    temp: `${Math.round(weatherData.current_weather.temperature)}°C`,
                    desc: "Aktualna pogoda"
                }));
            })
            .catch(err => {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            });
        return;
    }

    fs.readFile('./index.html', (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Nie znaleziono index.html");
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

server.listen(PORT);
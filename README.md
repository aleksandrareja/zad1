# Laboratorium PAwChO - Zadanie 1

### 1. Dane Autora
- **Imię i Nazwisko:** Aleksandra Reja
- **Grupa:** 6.7

---

### 2. Opis Aplikacji
Aplikacja została zrealizowana w języku JavaScript (Node.js) z wykorzystaniem wyłącznie modułów natywnych (`http`, `https`, `fs`), co pozwoliło na znaczną optymalizację rozmiaru.

**Funkcjonalność:**
- **Logi startowe:** Zaraz po uruchomieniu, aplikacja wypisuje w logach systemowych datę uruchomienia, imię i nazwisko autora oraz port TCP, na którym nasłuchuje.
- **Logika pogodowa:** Umożliwia wybór kraju i miasta z predefiniowanej listy. Dane o aktualnej pogodzie pobierane są dynamicznie z API Open-Meteo.

---

### 3. Optymalizacja Dockerfile
Plik Dockerfile został opracowany z uwzględnieniem następujących technik:
- **Wieloetapowe budowanie (Multi-stage build):** Rozdzielenie etapu przygotowania plików od etapu produkcyjnego w celu usunięcia zbędnych artefaktów.
- **Obraz bazowy Alpine:** Zastosowanie czystej dystrybucji Alpine Linux 3.21 zamiast pełnego obrazu Node.js zredukowało rozmiar obrazu z ok. 180 MB do ok. 80 MB.
- **Minimalizacja warstw:** Grupowanie instrukcji oraz kopiowanie tylko niezbędnych plików binarnych.
- **Standard OCI:** Dodano etykiety `LABEL` z danymi autora zgodnie ze standardem.
- **Healthcheck:** Zaimplementowano mechanizm sprawdzający stan serwera za pomocą skryptu Node.js (bez instalacji dodatkowych narzędzi typu curl).

---

### 4. Polecenia i weryfikacja

#### Budowanie obrazu

docker build -t zad1:latest .

#### Uruchomienie kontenera

docker run -d -p 8080:3000 --name weather-app zad1:latest

![alt text](image.png)

#### Pobranie informacji z logów

docker logs weather-app

Data uruchomienia: 5/4/2026, 9:16:39 AM
Autor programu: Aleksandra Reja
Aplikacja nasłuchuje na porcie: 3000

#### Sprawdzenie warstw i rozmiaru obrazu

docker history zad1:latest

docker images zad1:latest

Obraz ma 4 warstwy i rozmiar 106MB

### Sprawdzenie healthcheck

docker ps

### 5. Analiza podatności na zagrożenia

#### Wydano polecenie

docker scout cves zad1

#### Overview

                    │       Analyzed Image         
────────────────────┼──────────────────────────────
  Target            │  zad1:latest                 
    digest          │  f8fc3b3a2b4d                
    platform        │ linux/amd64                  
    vulnerabilities │    0C     2H     1M     0L   
    size            │ 31 MB                        
    packages        │ 39                           


#### Packages and Vulnerabilities

   0C     1H     0M     0L  nghttp2 1.64.0-r0
pkg:apk/alpine/nghttp2@1.64.0-r0?os_name=alpine&os_version=3.21

    x HIGH CVE-2026-27135
      https://scout.docker.com/v/CVE-2026-27135
      Affected range : <=1.64.0-r0  
      Fixed version  : not fixed    
    

   0C     1H     0M     0L  sqlite 3.48.0-r4
pkg:apk/alpine/sqlite@3.48.0-r4?os_name=alpine&os_version=3.21

    x HIGH CVE-2025-70873
      https://scout.docker.com/v/CVE-2025-70873
      Affected range : <=3.48.0-r4  
      Fixed version  : not fixed    
    

   0C     0H     1M     0L  busybox 1.37.0-r14
pkg:apk/alpine/busybox@1.37.0-r14?os_name=alpine&os_version=3.21

    x MEDIUM CVE-2025-60876
      https://scout.docker.com/v/CVE-2025-60876
      Affected range : <=1.37.0-r14  
      Fixed version  : not fixed     
    


3 vulnerabilities found in 3 packages
  CRITICAL  0  
  HIGH      2  
  MEDIUM    1  
  LOW       0  


#### Zgodnie z wymogami punktu 3 części nieobowiązkowej, przedstawiam uzasadnienie dla pozostawienia dwóch wykrytych zagrożeń klasy HIGH:

#### 1. Brak dostępnych poprawek (Status: Not Fixed): Skanowanie wykazało, że dla pakietów nghttp2 oraz sqlite w wersji zainstalowanej w obrazie bazowym Alpine 3.21 nie zostały jeszcze opublikowane wersje naprawcze (Fixed version: not fixed). Wykorzystałam najnowszą dostępną stabilną wersję obrazu bazowego oraz przeprowadziłam aktualizację pakietów, co jest najwyższym możliwym poziomem zminimalizowania zagrożeń na dany moment.

#### 2. Brak bezpośredniego wykorzystania podatnych bibliotek: Aplikacja jest prostym serwerem pogodowym napisanym w Node.js, który nie korzysta bezpośrednio z biblioteki sqlite ani nie implementuje zaawansowanych funkcji protokołu HTTP/2 obsługiwanych przez nghttp2. Ryzyko praktycznego wykorzystania tych luk w kontekście specyfiki aplikacji jest minimalne.


### 6. Realizacja zadania dodatkowego 2

#### 1. Utworzono instancję buildera przy użyciu polecenia docker buildx create ze sterownikiem docker-container.

#### 2. Proces budowy został zoptymalizowany pod kątem wykorzystania danych cache:

Wykorzystano backend inline (--cache-to type=inline), który dołącza metadane cache do manifestu obrazu.

Wykorzystano eksporter registry (--cache-from type=registry), co pozwala na pobieranie warstw cache bezpośrednio z Docker Hub podczas budowy.

#### 3. Obraz został przesłany do repozytorium zewnętrznego pod tagiem multiarch

docker buildx build --platform linux/amd64,linux/arm64 -t aleksandrareja/zad1:multiarch --cache-to type=inline --cache-from type=registry,ref=aleksandrareja/zad1:multiarch --push .

#### 4. Za pomocą polecenia docker buildx imagetools inspect potwierdzono, że manifest obrazu zawiera poprawne deklaracje dla platform linux/amd64 oraz linux/arm64.

docker buildx imagetools inspect aleksandrareja/zad1:multiarch
Name:      docker.io/aleksandrareja/zad1:multiarch
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:91f0e48a1c66495c17ecc3b9798eafcd5c05be5f985af57c561e08e166b73993
           
Manifests: 
  Name:        docker.io/aleksandrareja/zad1:multiarch@sha256:8591e5bc890e9381c1781a83b9129b37c72cba9f9956e20df502bf4f3d33f966
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/amd64
               
  Name:        docker.io/aleksandrareja/zad1:multiarch@sha256:1cabee4b5498d3e5b38459b3695b9102e22dca070ede842fa251e773dbb8da10
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/arm64
               
  Name:        docker.io/aleksandrareja/zad1:multiarch@sha256:f558c59bfc8535cfbefdd118a3c0c324efcd6c996bbdd1162c8d33cefc175929
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations: 
    vnd.docker.reference.type:   attestation-manifest
    vnd.docker.reference.digest: sha256:8591e5bc890e9381c1781a83b9129b37c72cba9f9956e20df502bf4f3d33f966
               
  Name:        docker.io/aleksandrareja/zad1:multiarch@sha256:769414666db6157e6c0ad1662588b21af24403de25ddca1bf0155b88d16348f5
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations: 
    vnd.docker.reference.digest: sha256:1cabee4b5498d3e5b38459b3695b9102e22dca070ede842fa251e773dbb8da10
    vnd.docker.reference.type:   attestation-manifest

#### 5. Wyczyszczono lokalny cache i zbudowano obraz ponownie z wykozystaniem cache z repozytorium

docker buildx prune -f

docker buildx build --platform linux/amd64,linux/arm64 -t aleksandrareja/zad1:multiarch --push --cache-to type=inline --cache-from type=registry,ref=aleksandrareja/zad1:multiarch .
[+] Building 14.1s (20/20) FINISHED                                       docker-container:moj_builder
 => [internal] load build definition from Dockerfile                                              0.1s
 => => transferring dockerfile: 1.28kB                                                            0.1s
 => [linux/arm64 internal] load metadata for docker.io/library/alpine:3.21                        2.0s
 => [linux/amd64 internal] load metadata for docker.io/library/alpine:3.21                        2.0s
 => [internal] load .dockerignore                                                                 0.1s
 => => transferring context: 2B                                                                   0.0s
 => importing cache manifest from aleksandrareja/zad1:multiarch                                   2.0s
 => => inferred cache manifest type: application/vnd.oci.image.index.v1+json                      0.0s
 => [internal] load build context                                                                 0.1s
 => => transferring context: 8.27kB                                                               0.0s
 => [linux/arm64 builder 1/3] FROM docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa  0.1s
 => => resolve docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa1bc06e426dc093194845  0.0s
 => [linux/amd64 builder 1/3] FROM docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa  3.1s
 => => resolve docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa1bc06e426dc093194845  0.1s
 => => sha256:897d797d2723cf0e318402f4d6f37d51b011517e5cf09246b22155f0fa90dc81 3.65MB / 3.65MB    2.0s
 => => extracting sha256:897d797d2723cf0e318402f4d6f37d51b011517e5cf09246b22155f0fa90dc81         0.8s
 => CACHED [linux/arm64 stage-1 2/4] RUN apk update && apk upgrade && apk add --no-cache nodejs   0.0s
 => CACHED [linux/arm64 stage-1 3/4] WORKDIR /app                                                 0.0s
 => CACHED [linux/arm64 builder 2/3] WORKDIR /app                                                 0.0s
 => CACHED [linux/arm64 builder 3/3] COPY server.js index.html ./                                 0.0s
 => CACHED [linux/arm64 stage-1 4/4] COPY --from=builder --chown=appuser:appgroup /app/server.js  0.4s
 => [linux/amd64 builder 2/3] WORKDIR /app                                                        0.2s
 => [linux/amd64 builder 3/3] COPY server.js index.html ./                                        0.2s
 => CACHED [linux/amd64 stage-1 2/4] RUN apk update && apk upgrade && apk add --no-cache nodejs   0.0s
 => CACHED [linux/amd64 stage-1 3/4] WORKDIR /app                                                 0.0s
 => CACHED [linux/amd64 stage-1 4/4] COPY --from=builder --chown=appuser:appgroup /app/server.js  0.2s
 => exporting to image                                                                            5.6s
 => => exporting layers                                                                           0.0s
 => => preparing layers for inline cache                                                          0.1s
 => => exporting manifest sha256:726b534ffaf766e8696cedfb38ae8e0662fa049bfcd0b880f3f05dd78e66e4e  0.0s
 => => exporting config sha256:2a7b5cb6ea7a5bb1b19a6f7bf13545bdf8718fcb49d22c9ff10bec0e2b71880d   0.0s
 => => exporting attestation manifest sha256:6213c71bdab89ff26f4e387d8f1aba6e8ba31b3c84f9b2d3c25  0.1s
 => => exporting manifest sha256:490c5978d258fcd6a46304e61cd3c0aebe1ceba8dad0274d16e80c2e0cf1786  0.0s
 => => exporting config sha256:f73a38fb5a21255991f80e8e66d2b6478c7af6c1862c5da1dc60d9a03f429e3d   0.0s
 => => exporting attestation manifest sha256:5f26b41427d6f115df4d74f199d361b0749783caba30b9e9adb  0.1s
 => => exporting manifest list sha256:8d7154922fd169507b5c2984d46e495a27b033f698c482e22f8998562c  0.0s
 => => pushing layers                                                                             1.6s
 => => pushing manifest for docker.io/aleksandrareja/zad1:multiarch@sha256:8d7154922fd169507b5c2  3.6s
 => [auth] aleksandrareja/zad1:pull,push token for registry-1.docker.io                           0.0s

Mimo wykonania docker buildx prune -f, który wyczyścił lokalny cache, builder był w stanie pobrać metadane cache'u bezpośrednio z Docker Hub, co potwierdza linia importing cache manifest
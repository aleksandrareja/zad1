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

#### Pobranie informacji z logów

docker logs weather-app

Data uruchomienia: 5/4/2026, 9:16:39 AM
Autor programu: Aleksandra Reja
Aplikacja nasłuchuje na porcie: 3000

#### Sprawdzenie warstw i rozmiaru obrazu

docker history zad1:latest

docker images zad1:latest

Rozmiar obrazu raportowany przez polecenie docker images (106 MB) jest wyższy niż suma warstw systemowych (ok. 80 MB), co wynika z dołączenia do obrazu metadanych generowanych przez narzędzie Buildx. Realna waga warstw została zminimalizowana poprzez wybór dystrybucji Alpine oraz rezygnację z menedżerów pakietów npm/yarn.

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
[+] Building 16.8s (22/22) FINISHED                                       docker-container:moj_builder
 => [internal] load build definition from Dockerfile                                              0.2s
 => => transferring dockerfile: 692B                                                              0.1s
 => [linux/amd64 internal] load metadata for docker.io/library/alpine:3.21                        2.5s
 => [linux/arm64 internal] load metadata for docker.io/library/alpine:3.21                        2.5s
 => [auth] library/alpine:pull token for registry-1.docker.io                                     0.0s
 => [internal] load .dockerignore                                                                 0.1s
 => => transferring context: 2B                                                                   0.0s
 => importing cache manifest from aleksandrareja/zad1:multiarch                                   3.0s
 => => inferred cache manifest type: application/vnd.oci.image.index.v1+json                      0.0s
 => [internal] load build context                                                                 0.3s
 => => transferring context: 8.27kB                                                               0.0s
 => [linux/amd64 builder 1/3] FROM docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa  3.0s
 => => resolve docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa1bc06e426dc093194845  0.0s
 => => sha256:897d797d2723cf0e318402f4d6f37d51b011517e5cf09246b22155f0fa90dc81 3.65MB / 3.65MB    1.8s
 => => extracting sha256:897d797d2723cf0e318402f4d6f37d51b011517e5cf09246b22155f0fa90dc81         1.0s
 => [auth] aleksandrareja/zad1:pull token for registry-1.docker.io                                0.0s
 => [linux/arm64 builder 1/3] FROM docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa  0.2s
 => => resolve docker.io/library/alpine:3.21@sha256:48b0309ca019d89d40f670aa1bc06e426dc093194845  0.2s
 => CACHED [linux/arm64 stage-1 2/4] RUN apk update && apk upgrade && apk add --no-cache nodejs   0.0s
 => CACHED [linux/arm64 stage-1 3/4] WORKDIR /app                                                 0.0s
 => CACHED [linux/arm64 builder 2/3] WORKDIR /app                                                 0.0s
 => CACHED [linux/arm64 builder 3/3] COPY server.js index.html ./                                 0.0s
 => CACHED [linux/arm64 stage-1 4/4] COPY --from=builder /app/server.js /app/index.html ./        0.3s
 => [linux/amd64 builder 2/3] WORKDIR /app                                                        0.1s
 => [linux/amd64 builder 3/3] COPY server.js index.html ./                                        0.2s
 => CACHED [linux/amd64 stage-1 2/4] RUN apk update && apk upgrade && apk add --no-cache nodejs   0.0s
 => CACHED [linux/amd64 stage-1 3/4] WORKDIR /app                                                 0.0s
 => CACHED [linux/amd64 stage-1 4/4] COPY --from=builder /app/server.js /app/index.html ./        0.2s
 => exporting to image                                                                            6.8s
 => => exporting layers                                                                           0.0s
 => => preparing layers for inline cache                                                          0.1s
 => => exporting manifest sha256:8591e5bc890e9381c1781a83b9129b37c72cba9f9956e20df502bf4f3d33f96  0.0s
 => => exporting config sha256:3fb9de8fbb619e4aa79656c12a39c8338091e70ffaee6ca253876dc6180230de   0.0s
 => => exporting attestation manifest sha256:01cd5db7e66d6e2f0973b1e4933d15c52b20d066271e4082b92  0.1s
 => => exporting manifest sha256:fb448d15a886f2870b9deccb55a4c3e1566e26bbced6855be1f39ed4b74a96f  0.1s
 => => exporting config sha256:e7673e3a9dde09b95b6c14a694ffa2e5e48d279966c0fed667fb77efbb60d512   0.1s
 => => exporting attestation manifest sha256:fd0cc1a6236df664e3029d9c06b33c20f69cd865047d82a3f9f  0.1s
 => => exporting manifest list sha256:db441557762f009cca60b305f68ec2b5209ff276c151a71fab11771a2c  0.1s
 => => pushing layers                                                                             1.9s
 => => pushing manifest for docker.io/aleksandrareja/zad1:multiarch@sha256:db441557762f009cca60b  4.2s
 => [auth] aleksandrareja/zad1:pull,push token for registry-1.docker.io                           0.0s

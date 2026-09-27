FROM debian:bookworm-slim AS build

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    xz-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root developer user
RUN useradd -m -u 1000 developer

# Download and verify the pinned official Flutter SDK.
ENV FLUTTER_HOME=/opt/flutter
ENV PATH="${FLUTTER_HOME}/bin:${PATH}"
ARG FLUTTER_VERSION=3.47.5
ARG FLUTTER_SHA256=2132e990f236f8d22e7c6314b29a191a95b10d7cbcfec9b4e2e303d996652cbb

RUN curl --retry 5 --retry-delay 3 --retry-all-errors -fSL \
        "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" \
        -o flutter.tar.xz && \
    echo "${FLUTTER_SHA256}  flutter.tar.xz" | sha256sum -c - && \
    tar -xf flutter.tar.xz -C /opt && \
    rm flutter.tar.xz && \
    chown -R developer:developer /opt/flutter && \
    mkdir -p /app && chown -R developer:developer /app

# Switch to non-root developer user
USER developer
WORKDIR /app

RUN git config --global --add safe.directory /opt/flutter && \
    flutter config --no-analytics && \
    flutter config --enable-web && \
    flutter precache --web

# Resolve dependencies in a cacheable layer before copying application sources.
COPY --chown=developer:developer pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copy only inputs required for a web build so native projects, tests, and the
# runtime Nginx configuration do not invalidate the expensive Flutter layer.
COPY --chown=developer:developer .metadata analysis_options.yaml ./
COPY --chown=developer:developer lib ./lib
COPY --chown=developer:developer assets ./assets
COPY --chown=developer:developer web ./web
ARG API_BASE_URL=/api
RUN flutter build web --release --dart-define=API_BASE_URL=${API_BASE_URL}

# Stage 2: Production Nginx Server
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8085

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8085/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

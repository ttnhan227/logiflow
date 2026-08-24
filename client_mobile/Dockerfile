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

# Download official Flutter SDK from Google CDN with retry & resume support
ENV FLUTTER_HOME=/opt/flutter
ENV PATH="${FLUTTER_HOME}/bin:${PATH}"

RUN curl --retry 5 --retry-delay 3 --retry-all-errors -fSL https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.24.5-stable.tar.xz -o flutter.tar.xz && \
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

# Copy full source
COPY --chown=developer:developer . .

# Fetch dependencies and compile web release
RUN flutter pub get && \
    flutter build web --release

# Stage 2: Production Nginx Server
FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8085

CMD ["nginx", "-g", "daemon off;"]

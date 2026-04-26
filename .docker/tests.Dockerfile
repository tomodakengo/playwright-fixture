# Playwright runner — uses the official Microsoft Container Registry image.
# Browsers are pre-installed at /ms-playwright (no `playwright install` needed).
#
# IMPORTANT: keep this version in sync with @playwright/test in package.json.
FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /workspace

# Install deps first so layer caches independently of source changes.
COPY package.json package-lock.json ./
RUN npm ci

# Project source. node_modules is masked by a named volume in compose so
# host bind-mounts don't clobber it.
COPY . .

# Make the entrypoint script executable (executable bit is preserved on Linux
# but not on Windows-checkouts; chmod here to be safe).
RUN chmod +x scripts/docker-entrypoint.sh \
 && chown -R pwuser:pwuser /workspace

# Run as the image's non-root user (pre-baked by the MCR image).
USER pwuser

ENTRYPOINT ["/workspace/scripts/docker-entrypoint.sh"]
CMD ["npm", "test"]

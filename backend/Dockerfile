FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (including dev) and build
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:18-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --silent \
  && mkdir -p /app/public/uploads

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Ensure non-root ownership
RUN addgroup -g 1001 -S appgroup \
  && adduser -S appuser -u 1001 -G appgroup \
  && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -q -O - http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
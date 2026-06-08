# Stage 1: Build dependency cache and run build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production image, copy minimal assets
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Don't run production containers as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]

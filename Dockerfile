FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Seed buiten /app/data zodat een Coolify-volume op data/ de defaults niet verbergt.
COPY data/config.json /app/config.seed.json

RUN mkdir -p data vid \
  && if [ ! -f data/config.json ]; then cp /app/config.seed.json data/config.json; fi

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health 2>/dev/null | grep -q '"ok":true' || exit 1

CMD ["node", "server.js"]
